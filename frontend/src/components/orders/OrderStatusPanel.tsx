import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatInr } from '@/utils/cartBilling';
import type { OrderStatus, PaymentStatus } from '@/types/order.types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const NAVY = '#111152';
const STEPS = ['ordered', 'outForDelivery', 'delivered'] as const;
const HERO_HEIGHT = 300;

const IMG_ON_THE_WAY = require('../../../assets/images/On-the-way-delivery-pic.webp');
const IMG_DELIVERED = require('../../../assets/images/After-Delivery-Pic.webp');

const STEP_ICONS: Record<(typeof STEPS)[number], React.ComponentProps<typeof Ionicons>['name']> = {
  ordered: 'cube',
  outForDelivery: 'bicycle',
  delivered: 'checkmark-circle',
};

export const orderStatusStep = (
  paymentStatus: PaymentStatus,
  status: OrderStatus,
): number => {
  if (paymentStatus === 'failed' || status === 'cancelled') return -1;
  if (status === 'delivered') return 2;
  return 1;
};

const accentFor = (status: OrderStatus, paymentStatus: PaymentStatus) => {
  if (status === 'cancelled') return '#EF4444';
  if (paymentStatus === 'failed') return '#F59E0B';
  if (status === 'delivered') return '#10B981';
  return '#3B82F6';
};

const hasHeroImage = (status: OrderStatus, paymentStatus: PaymentStatus) =>
  paymentStatus !== 'failed' && status !== 'cancelled';

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
  const current = orderStatusStep(paymentStatus, status);
  const accent = accentFor(status, paymentStatus);
  const showImage = hasHeroImage(status, paymentStatus);
  const isDelivered = status === 'delivered';
  const inProgress =
    paymentStatus !== 'failed' &&
    status !== 'cancelled' &&
    status !== 'delivered';

  const heroOpacity = useSharedValue(0);
  const kickerSlide = useSharedValue(-14);
  const kickerOpacity = useSharedValue(0);
  const textSlide = useSharedValue(16);
  const textOpacity = useSharedValue(0);
  const deliveredFade = useSharedValue(isDelivered ? 1 : 0);
  const pulseVal = useSharedValue(1);
  const metaOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = 0;
    kickerSlide.value = -14;
    kickerOpacity.value = 0;
    textSlide.value = 16;
    textOpacity.value = 0;

    heroOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    kickerSlide.value = withDelay(
      160,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    kickerOpacity.value = withDelay(160, withTiming(1, { duration: 420 }));
    textSlide.value = withDelay(
      280,
      withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }),
    );
    textOpacity.value = withDelay(280, withTiming(1, { duration: 480 }));
    metaOpacity.value = withDelay(380, withTiming(1, { duration: 360 }));
    deliveredFade.value = withTiming(isDelivered ? 1 : 0, {
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [
    status,
    isDelivered,
    heroOpacity,
    kickerSlide,
    kickerOpacity,
    textSlide,
    textOpacity,
    deliveredFade,
    metaOpacity,
  ]);

  useEffect(() => {
    if (inProgress) {
      pulseVal.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseVal.value = withTiming(1, { duration: 280 });
    }
  }, [inProgress, pulseVal]);

  const heroAnim = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));
  const kickerAnim = useAnimatedStyle(() => ({
    opacity: kickerOpacity.value,
    transform: [{ translateX: kickerSlide.value }],
  }));
  const titleAnim = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textSlide.value }],
  }));
  const onTheWayAnim = useAnimatedStyle(() => ({
    opacity: 1 - deliveredFade.value,
  }));
  const deliveredAnim = useAnimatedStyle(() => ({
    opacity: deliveredFade.value,
  }));
  const pulseAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulseVal.value }],
  }));
  const metaAnim = useAnimatedStyle(() => ({ opacity: metaOpacity.value }));

  const copy =
    status === 'cancelled'
      ? { kicker: t('orders.status.cancelled'), title: t('orders.cancelledTitle'), sub: t('orders.cancelledSubtitle') }
      : paymentStatus === 'failed'
        ? { kicker: t('orders.status.failed'), title: t('orders.failedTitle'), sub: t('orders.failedSubtitle') }
        : status === 'delivered'
          ? { kicker: t('orders.status.delivered'), title: t('orders.completeTitle'), sub: t('orders.completeSubtitle') }
          : {
              kicker: t('orders.status.out_for_delivery'),
              title: t('orders.outForDeliveryTitle'),
              sub: t('orders.outForDeliverySubtitle'),
            };

  return (
    <View>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={[styles.hero, heroAnim]}>
        {showImage ? (
          <>
            <Animated.View style={[styles.heroImageWrap, onTheWayAnim]}>
              <Image source={IMG_ON_THE_WAY} style={styles.heroImage} resizeMode="cover" />
            </Animated.View>
            <Animated.View style={[styles.heroImageWrap, deliveredAnim]} pointerEvents="none">
              <Image source={IMG_DELIVERED} style={styles.heroImage} resizeMode="cover" />
            </Animated.View>
            <LinearGradient
              colors={['rgba(8,12,32,0.58)', 'rgba(8,12,32,0.18)', 'rgba(8,12,32,0.42)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <LinearGradient colors={['#3B1F2B', '#1F1135']} style={StyleSheet.absoluteFill} />
        )}

        <View style={[styles.heroInner, { paddingTop: insets.top + spacing.sm }]}>
          {showClose ? (
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.closeSpacer} />
          )}

          <View style={styles.textOverlay}>
            <Animated.View style={[styles.statusChip, { backgroundColor: accent }, kickerAnim]}>
              {inProgress ? <View style={styles.statusDotLive} /> : null}
              <Text style={styles.statusChipText}>{copy.kicker}</Text>
            </Animated.View>
            <Animated.Text style={[styles.heroTitle, titleAnim]}>{copy.title}</Animated.Text>
            <Animated.Text style={[styles.heroSub, titleAnim]}>{copy.sub}</Animated.Text>
          </View>
        </View>
      </Animated.View>

      <View style={[styles.sheet, shadows.lg]}>
        <Animated.View style={[styles.metaChip, metaAnim]}>
          <Text style={styles.publicId}>{publicId}</Text>
          <Text style={styles.amount}>{formatInr(grandTotal)}</Text>
        </Animated.View>

        <View style={styles.stepper}>
          {STEPS.map((key, i) => {
            const active = current >= i;
            const now = current === i;
            const last = i === STEPS.length - 1;
            const icon = (
              <View
                style={[
                  styles.stepIconWrap,
                  active ? { backgroundColor: accent } : styles.stepIconPending,
                  now && inProgress && styles.stepIconNow,
                  now && inProgress && { borderColor: accent },
                ]}
              >
                <Ionicons
                  name={active && last ? 'checkmark' : STEP_ICONS[key]}
                  size={16}
                  color={active ? (now && inProgress ? accent : '#fff') : colors.textMuted}
                />
              </View>
            );

            return (
              <View key={key} style={styles.stepCol}>
                <View style={styles.stepIconRow}>
                  <View
                    style={[
                      styles.stepLine,
                      i === 0 && styles.stepLineHidden,
                      current >= i && i > 0 && { backgroundColor: accent },
                    ]}
                  />
                  {now && inProgress ? (
                    <Animated.View style={pulseAnim}>{icon}</Animated.View>
                  ) : (
                    icon
                  )}
                  <View
                    style={[
                      styles.stepLine,
                      last && styles.stepLineHidden,
                      current > i && { backgroundColor: accent },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active && styles.stepLabelActive,
                    now && { color: accent },
                  ]}
                >
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
    height: HERO_HEIGHT,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0B1220',
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: {
    height: 38,
  },
  textOverlay: {
    marginTop: spacing.md,
    maxWidth: '78%',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    gap: 6,
  },
  statusDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusChipText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heroSub: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
    lineHeight: 19,
  },
  sheet: {
    marginTop: -22,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  metaChip: {
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
  stepper: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 36,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconPending: {
    backgroundColor: '#F1F3F8',
  },
  stepIconNow: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8EAF0',
    borderRadius: 1,
  },
  stepLineHidden: {
    backgroundColor: 'transparent',
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default OrderStatusPanel;
