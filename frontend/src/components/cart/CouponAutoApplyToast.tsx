import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { formatInr } from '@/utils/cartBilling';
import type { AutoApplyToastPayload } from '@/context/CartContext';
import {
  FestiveCouponShell,
  festiveCouponModalStyles,
  type FestiveCouponVariant,
} from '@/components/cart/FestiveCouponCard';
import theme from '@/styles/theme';

const { spacing, shadows } = theme;

const GREEN = '#0C831F';
export const AUTO_APPLY_TOAST_MS = 2800;

type Props = {
  visible: boolean;
  payload: AutoApplyToastPayload | null;
  onDismiss: () => void;
};

const isDiwaliOffer = (payload: AutoApplyToastPayload) =>
  payload.code === 'DIWALI25' ||
  payload.title.toLowerCase().includes('diwali');

const resolveToastVariant = (
  payload: AutoApplyToastPayload,
  hasSavings: boolean,
): FestiveCouponVariant => {
  if (isDiwaliOffer(payload)) {
    return 'diwali';
  }
  if (payload.deliveryUnlocked && !hasSavings) {
    return 'delivery';
  }
  return 'diwali';
};

const CouponAutoApplyToast = ({ visible, payload, onDismiss }: Props) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(1);
  const dismissed = useRef(false);

  const finishDismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    onDismiss();
  };

  useEffect(() => {
    if (!visible || !payload) {
      dismissed.current = false;
      progress.value = 1;
      return;
    }

    dismissed.current = false;
    progress.value = 1;
    progress.value = withTiming(
      0,
      { duration: AUTO_APPLY_TOAST_MS, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(finishDismiss)();
        }
      },
    );

    return () => {
      progress.value = 1;
    };
  }, [visible, payload, progress]);

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible || !payload) {
    return null;
  }

  const hasSavings = payload.promoDiscount > 0;
  const variant = resolveToastVariant(payload, hasSavings);
  const diwali = variant === 'diwali';

  const badgeLabel = diwali
    ? t('cart.offersDiwaliBadge')
    : t('cart.offersAutoAppliedDeliveryShort');

  const mainLine = hasSavings
    ? t('cart.offersAutoAppliedSaved', { amount: formatInr(payload.promoDiscount) })
    : payload.deliveryUnlocked
      ? t('cart.offersAutoAppliedDeliveryShort')
      : t('cart.offersApplied');

  const extraLine =
    hasSavings && payload.deliveryUnlocked
      ? t('cart.offersAutoAppliedDeliveryShort')
      : null;

  const stubCode = payload.code;
  const stubLabel = !stubCode && payload.deliveryUnlocked ? t('cart.free') : null;

  const subtitleLine =
    extraLine ??
    (payload.title && payload.title !== mainLine ? payload.title : undefined);

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(180)}
          style={[styles.cardWrap, { maxWidth: Math.min(width - spacing.xl * 2, 320) }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <FestiveCouponShell
              variant={variant}
              badgeLabel={badgeLabel}
              applied
              appliedLabel={t('cart.offersApplied')}
              title={mainLine}
              subtitle={subtitleLine}
              stubCode={stubCode}
              stubLabel={stubLabel}
              footer={
                <View style={festiveCouponModalStyles.timerTrack}>
                  <Animated.View
                    style={[festiveCouponModalStyles.timerFill, timerBarStyle]}
                  />
                </View>
              }
            >
              <View style={festiveCouponModalStyles.checkRingOuter}>
                <View style={festiveCouponModalStyles.checkRingInner}>
                  <Ionicons name="checkmark" size={28} color={GREEN} />
                </View>
              </View>
            </FestiveCouponShell>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 82, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardWrap: {
    width: '100%',
    ...shadows.lg,
  },
});

export default CouponAutoApplyToast;
