import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderStatusPanel from '@/components/orders/OrderStatusPanel';
import OrderDeliverySupportCard from '@/components/orders/OrderDeliverySupportCard';
import { useLiveOrderStatus } from '@/hooks/useLiveOrderStatus';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const NAVY = '#111152';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'OrderPlaced'>;
type Rt = RouteProp<AuthStackParamList, 'OrderPlaced'>;

const OrderPlacedScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const liveStatus = useLiveOrderStatus(params?.orderId, 'confirmed');

  const goOrders = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Orders' } }],
    });
  }, [navigation]);

  const goHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Home' } }],
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goOrders();
        return true;
      });
      return () => sub.remove();
    }, [goOrders]),
  );

  const showActiveSupport = liveStatus !== 'cancelled' && liveStatus !== 'delivered';
  const showDeliveredSupport = liveStatus === 'delivered';
  const bottomInset = Math.max(insets.bottom, spacing.lg);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + spacing.md }]}
      >
        <OrderStatusPanel
          publicId={params?.publicId ?? ''}
          grandTotal={params?.grandTotal ?? 0}
          paymentStatus="pending"
          status={liveStatus}
          showHome
          onHome={goHome}
        />

        {showActiveSupport ? <OrderDeliverySupportCard variant="active" /> : null}
        {showDeliveredSupport ? <OrderDeliverySupportCard variant="delivered" /> : null}

        <View style={styles.footer}>
          <Pressable
            onPress={goOrders}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={({ pressed }) => [
              styles.btn,
              pressed && Platform.OS === 'ios' && styles.pressed,
            ]}
          >
            <Text style={styles.btnText}>{t('orders.viewOrders')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  scroll: {
    flexGrow: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  btn: {
    backgroundColor: NAVY,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.white,
  },
  pressed: { opacity: 0.88 },
});

export default OrderPlacedScreen;
