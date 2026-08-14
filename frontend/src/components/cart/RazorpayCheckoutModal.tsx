import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import type { CheckoutSession, RazorpaySuccessPayload } from '@/types/order.types';
import theme from '@/styles/theme';

type Prefill = {
  name?: string | null;
  contact?: string | null;
};

type Props = {
  visible: boolean;
  session: CheckoutSession | null;
  prefill: Prefill;
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onClose: () => void;
};

const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';

const EXTERNAL_SCHEMES = [
  'upi://',
  'phonepe://',
  'tez://',
  'gpay://',
  'paytmmp://',
  'bhim://',
  'credpay://',
  'ppe://',
  'amazonpay://',
];

const { colors, spacing, typography } = theme;

const isExternalPayUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.startsWith('intent:') || EXTERNAL_SCHEMES.some((scheme) => lower.startsWith(scheme));
};

const intentToUpiUrl = (url: string) => {
  const schemeMatch = url.match(/scheme=([^;]+)/i);
  const scheme = schemeMatch?.[1]?.trim();
  if (!scheme) return null;
  const path = url.replace(/^intent:\/\//i, '').split('#Intent')[0];
  return `${scheme}://${path}`;
};

const openExternalPayUrl = async (url: string) => {
  try {
    if (url.toLowerCase().startsWith('intent:')) {
      const converted = intentToUpiUrl(url);
      if (converted && (await Linking.canOpenURL(converted))) {
        await Linking.openURL(converted);
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    // App may not be installed; Razorpay still offers UPI ID / cards.
  }
};

const buildHtml = (session: CheckoutSession, prefill: Prefill) => {
  const options = {
    key: session.keyId,
    amount: session.amountPaise,
    currency: session.currency,
    name: 'Sneheal',
    description: session.publicId,
    order_id: session.razorpayOrderId,
    theme: { color: '#111152' },
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },
    prefill: {
      name: prefill.name || '',
      contact: (prefill.contact || '').replace(/^\+91/, ''),
    },
    modal: {
      confirm_close: true,
      animation: true,
    },
    retry: { enabled: true, max_count: 2 },
  };
  const serialized = JSON.stringify(options).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin: 0; padding: 0; background: #F5F6F8; height: 100%; }
    </style>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
    <script>
      var options = ${serialized};
      options.handler = function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        }));
      };
      options.modal = Object.assign(options.modal || {}, {
        ondismiss: function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismissed' }));
        }
      });
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'failed',
          description: (resp && resp.error && resp.error.description) || 'Payment failed'
        }));
      });
      rzp.open();
    </script>
  </body>
</html>`;
};

const RazorpayCheckoutModal = ({ visible, session, prefill, onSuccess, onClose }: Props) => {
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const html = useMemo(() => {
    if (!session) return '';
    return buildHtml(session, prefill);
  }, [session, prefill]);

  const handleBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return true;
    }
    onClose();
    return true;
  }, [canGoBack, onClose]);

  useEffect(() => {
    if (!visible) {
      setCanGoBack(false);
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack, visible]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      };
      if (
        data.type === 'success' &&
        data.razorpay_payment_id &&
        data.razorpay_order_id &&
        data.razorpay_signature
      ) {
        onSuccess({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
        return;
      }
      if (data.type === 'failed') {
        return;
      }
      onClose();
    } catch {
      onClose();
    }
  };

  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
    const url = request.url || '';
    if (isExternalPayUrl(url)) {
      void openExternalPayUrl(url);
      return false;
    }
    return true;
  };

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  };

  if (!visible || !session) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={handleBack}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <WebView
          ref={webViewRef}
          key={session.razorpayOrderId}
          originWhitelist={['*', 'upi://*', 'intent://*', 'phonepe://*', 'tez://*', 'gpay://*']}
          source={{ html, baseUrl: 'https://api.razorpay.com' }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          onOpenWindow={(event) => {
            const targetUrl = event.nativeEvent.targetUrl;
            if (isExternalPayUrl(targetUrl)) {
              void openExternalPayUrl(targetUrl);
              return;
            }
            webViewRef.current?.injectJavaScript(
              `window.location.href = ${JSON.stringify(targetUrl)}; true;`,
            );
          }}
          userAgent={Platform.OS === 'ios' ? undefined : CHROME_UA}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows
          nestedScrollEnabled
          startInLoadingState
          mixedContentMode="always"
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  closeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default RazorpayCheckoutModal;
