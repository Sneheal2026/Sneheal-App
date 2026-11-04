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
import { LinearGradient } from 'expo-linear-gradient';
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
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, moderateScale, shadows } = theme;

const GREEN = '#0C831F';
const DIWALI_GRADIENT = ['#FF8A00', '#E85D04', '#9D0208'] as const;
export const AUTO_APPLY_TOAST_MS = 2800;

type Props = {
  visible: boolean;
  payload: AutoApplyToastPayload | null;
  onDismiss: () => void;
};

const isDiwaliOffer = (payload: AutoApplyToastPayload) =>
  payload.code === 'DIWALI25' ||
  payload.title.toLowerCase().includes('diwali');

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

  const diwali = isDiwaliOffer(payload);
  const hasSavings = payload.promoDiscount > 0;

  const eyebrow = diwali ? t('cart.offersDiwaliBadge') : t('cart.offersApplied');

  const mainLine = hasSavings
    ? t('cart.offersAutoAppliedSaved', { amount: formatInr(payload.promoDiscount) })
    : payload.deliveryUnlocked
      ? t('cart.offersAutoAppliedDeliveryShort')
      : t('cart.offersApplied');

  const extraLine =
    hasSavings && payload.deliveryUnlocked
      ? t('cart.offersAutoAppliedDeliveryShort')
      : null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(180)}
          style={[styles.cardWrap, { maxWidth: Math.min(width - spacing.xl * 2, 300) }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[...DIWALI_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={11} color={DIWALI_GRADIENT[1]} />
                <Text style={styles.badgeText}>{eyebrow}</Text>
              </View>

              <View style={styles.checkRing}>
                <Ionicons name="checkmark" size={28} color={GREEN} />
              </View>

              <Text style={styles.mainLine}>{mainLine}</Text>

              {extraLine ? <Text style={styles.extraLine}>{extraLine}</Text> : null}

              <View style={styles.timerTrack}>
                <Animated.View style={[styles.timerFill, timerBarStyle]} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 82, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardWrap: {
    width: '100%',
    ...shadows.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: moderateScale(10, 0.35),
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: DIWALI_GRADIENT[1],
  },
  checkRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  mainLine: {
    fontSize: moderateScale(22, 0.35),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  extraLine: {
    fontSize: moderateScale(12, 0.35),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  timerTrack: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
});

export default CouponAutoApplyToast;
