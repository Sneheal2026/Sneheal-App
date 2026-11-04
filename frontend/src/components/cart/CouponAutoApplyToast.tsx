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

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const NAVY = '#111152';
const GREEN = '#0C831F';
const GRADIENT = ['#FF8A00', '#E85D04', '#9D0208'] as const;
export const AUTO_APPLY_TOAST_MS = 3000;

type Props = {
  visible: boolean;
  payload: AutoApplyToastPayload | null;
  onDismiss: () => void;
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

  const savingsLine =
    payload.promoDiscount > 0
      ? t('cart.offersAutoAppliedSavings', {
          amount: formatInr(payload.promoDiscount),
        })
      : null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={[styles.cardWrap, { maxWidth: Math.min(width - spacing.xl * 2, 360) }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[...GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.iconRing}>
                <Ionicons name="checkmark-circle" size={36} color={GREEN} />
              </View>
              <Text style={styles.kicker}>{t('cart.offersAutoAppliedKicker')}</Text>
              <Text style={styles.title}>{payload.title}</Text>
              {payload.code ? (
                <View style={styles.codeChip}>
                  <Text style={styles.codeText}>{payload.code}</Text>
                </View>
              ) : null}
              {savingsLine ? <Text style={styles.savings}>{savingsLine}</Text> : null}
              {payload.deliveryUnlocked ? (
                <View style={styles.deliveryRow}>
                  <Ionicons name="bicycle" size={16} color={colors.white} />
                  <Text style={styles.deliveryText}>{t('cart.offersAutoAppliedDelivery')}</Text>
                </View>
              ) : null}
              <Text style={styles.tapHint}>{t('cart.offersAutoAppliedTap')}</Text>
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
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  kicker: {
    fontSize: moderateScale(11, 0.35),
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: moderateScale(20, 0.35),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  codeChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  codeText: {
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.white,
    fontSize: moderateScale(13, 0.35),
  },
  savings: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  deliveryText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.white,
  },
  tapHint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xxs,
  },
  timerTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
});

export default CouponAutoApplyToast;
