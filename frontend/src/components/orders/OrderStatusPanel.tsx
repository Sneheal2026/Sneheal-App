import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatInr } from '@/utils/cartBilling';
import type { OrderStatus, PaymentStatus } from '@/types/order.types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;
const NAVY = '#111152';
const NAVY_SOFT = '#1C1C6A';
const STEPS = ['paid', 'packed', 'onWay', 'delivered'] as const;

export const orderStatusStep = (
  paymentStatus: PaymentStatus,
  status: OrderStatus,
): number => {
  if (paymentStatus === 'failed' || status === 'cancelled') return -1;
  if (paymentStatus !== 'paid') return 0;
  return 1;
};

type Props = {
  publicId: string;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  showClose?: boolean;
  onClose?: () => void;
};

const OrderStatusPanel = ({
  publicId,
  grandTotal,
  paymentStatus,
  status,
  showClose,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;
  const current = orderStatusStep(paymentStatus, status);
  const inProgress = current >= 1 && status === 'confirmed';

  useEffect(() => {
    if (!inProgress) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [inProgress, pulse]);

  const copy =
    status === 'cancelled'
      ? { kicker: t('orders.status.cancelled'), title: t('orders.cancelledTitle'), sub: t('orders.cancelledSubtitle') }
      : paymentStatus === 'failed'
        ? { kicker: t('orders.status.failed'), title: t('orders.failedTitle'), sub: t('orders.failedSubtitle') }
        : paymentStatus !== 'paid'
          ? { kicker: t('orders.status.awaiting_payment'), title: t('orders.pendingTitle'), sub: t('orders.pendingSubtitle') }
          : { kicker: t('orders.placedKicker'), title: t('orders.placedTitle'), sub: t('orders.placedSubtitle') };

  return (
    <View>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <LinearGradient
        colors={[NAVY, NAVY_SOFT]}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        {showClose ? (
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        ) : null}
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.heroTitle}>{copy.title}</Text>

        <View style={styles.journey}>
          <View style={styles.node}>
            <Ionicons name="medkit" size={18} color="#fff" />
          </View>
          <View style={styles.dash} />
          <Animated.View style={[styles.scooter, inProgress && { transform: [{ scale: pulse }] }]}>
            <Ionicons name="bicycle" size={22} color={NAVY} />
          </Animated.View>
          <View style={styles.dash} />
          <View style={styles.node}>
            <Ionicons name="home" size={18} color="#fff" />
          </View>
        </View>
        <View style={styles.journeyLabels}>
          <Text style={styles.journeyLabel}>{t('orders.hub')}</Text>
          <Text style={styles.journeyLabel}>{t('orders.yourDoor')}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.sheet, shadows.lg]}>
        <Text style={styles.subtitle}>{copy.sub}</Text>
        <View style={styles.chip}>
          <Text style={styles.publicId}>{publicId}</Text>
          <Text style={styles.amount}>{formatInr(grandTotal)}</Text>
        </View>
        <View style={styles.steps}>
          {STEPS.map((key, i) => {
            const active = current >= i;
            const now = current === i;
            return (
              <View key={key} style={styles.step}>
                <View style={[styles.dot, active && styles.dotOn, now && styles.dotNow]} />
                <Text style={[styles.stepLabel, active && styles.stepOn]}>
                  {t(`orders.steps.${key}`)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 12,
  },
  close: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kicker: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
    marginTop: 6,
  },
  journey: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  journeyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  journeyLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
  },
  node: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  scooter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -20,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  chip: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  publicId: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: NAVY,
  },
  amount: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  steps: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  step: { flex: 1, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  dotOn: { backgroundColor: NAVY },
  dotNow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepOn: { color: colors.textPrimary, fontWeight: '700' },
});

export default OrderStatusPanel;
