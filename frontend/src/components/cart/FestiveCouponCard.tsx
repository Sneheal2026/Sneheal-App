import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { CartOffer } from '@/types/cartQuote.types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

export const CART_PAGE_BG = '#F5F6F8';
const GREEN = '#0C831F';

const DIWALI_GRADIENT = ['#FF8A00', '#E85D04', '#9D0208'] as const;
const GOLD_FRAME_GRADIENT = ['#FFF8DC', '#F5D061', '#C9A227', '#F5D061', '#FFF8DC'] as const;
const DIWALI_COUPON_BG = ['#2D1B4E', '#6A040F', '#9D0208', '#E85D04', '#FFBA08'] as const;
const DELIVERY_COUPON_BG = ['#052E16', '#0B5345', '#0C831F', '#2D6A4F', '#95D5B2'] as const;

const COUPON_NOTCH_SIZE = 16;
const PERF_DOT_COUNT = 28;

export type FestiveCouponVariant = 'diwali' | 'delivery';

const VARIANT_THEME = {
  diwali: {
    body: DIWALI_COUPON_BG,
    shadowColor: '#9D0208',
    badgeIcon: 'sparkles' as const,
    badgeIconColor: DIWALI_GRADIENT[1],
    badgeTextColor: DIWALI_GRADIENT[1],
    perfDot: 'rgba(255, 248, 220, 0.55)',
    glowLarge: 'rgba(255, 186, 8, 0.22)',
    glowSmall: 'rgba(255, 255, 255, 0.12)',
    decorIcon: 'sparkles' as const,
    decorIconColor: 'rgba(255, 248, 220, 0.35)',
    stubIcon: 'ticket' as const,
    stubIconColor: '#FFE566',
  },
  delivery: {
    body: DELIVERY_COUPON_BG,
    shadowColor: '#0C831F',
    badgeIcon: 'bicycle' as const,
    badgeIconColor: GREEN,
    badgeTextColor: GREEN,
    perfDot: 'rgba(230, 255, 240, 0.6)',
    glowLarge: 'rgba(149, 213, 178, 0.28)',
    glowSmall: 'rgba(255, 255, 255, 0.14)',
    decorIcon: 'flash' as const,
    decorIconColor: 'rgba(230, 255, 240, 0.4)',
    stubIcon: 'bicycle' as const,
    stubIconColor: '#D8F3DC',
  },
} as const;

type CouponShellProps = {
  variant: FestiveCouponVariant;
  badgeLabel: string;
  applied?: boolean;
  appliedLabel?: string;
  title: string;
  subtitle?: string;
  gapText?: string | null;
  stubLabel?: string | null;
  stubCode?: string | null;
  footer?: ReactNode;
  children?: ReactNode;
};

export const FestiveCouponShell = ({
  variant,
  badgeLabel,
  applied,
  appliedLabel,
  title,
  subtitle,
  gapText,
  stubLabel,
  stubCode,
  footer,
  children,
}: CouponShellProps) => {
  const themeVariant = VARIANT_THEME[variant];
  const showStub = Boolean(stubCode || stubLabel);

  return (
    <View style={[styles.couponShell, { shadowColor: themeVariant.shadowColor }]}>
      <LinearGradient
        colors={[...GOLD_FRAME_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.couponGoldFrame}
      >
        <LinearGradient
          colors={[...themeVariant.body]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.couponBodyGradient}
        >
          <View pointerEvents="none" style={styles.couponDecorLayer}>
            <View style={[styles.couponGlowOrbLarge, { backgroundColor: themeVariant.glowLarge }]} />
            <View style={[styles.couponGlowOrbSmall, { backgroundColor: themeVariant.glowSmall }]} />
            <Ionicons
              name={themeVariant.decorIcon}
              size={moderateScale(22, 0.35)}
              color={themeVariant.decorIconColor}
              style={styles.couponSparkleAccent}
            />
          </View>

          <View style={styles.couponInsetPanel}>
            <View style={styles.featuredTop}>
              <View style={styles.featuredBadge}>
                <Ionicons
                  name={themeVariant.badgeIcon}
                  size={12}
                  color={themeVariant.badgeIconColor}
                />
                <Text style={[styles.featuredBadgeText, { color: themeVariant.badgeTextColor }]}>
                  {badgeLabel}
                </Text>
              </View>
              {applied && appliedLabel ? (
                <View style={styles.appliedPill}>
                  <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                  <Text style={styles.appliedPillText}>{appliedLabel}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.featuredTitle}>{title}</Text>
            {subtitle ? <Text style={styles.featuredSub}>{subtitle}</Text> : null}
            {gapText ? <Text style={styles.featuredGap}>{gapText}</Text> : null}
            {children}
          </View>

          {showStub ? (
            <>
              <CouponTearLine perfDotColor={themeVariant.perfDot} />
              <View style={styles.codeStub}>
                <View style={styles.codeChip}>
                  <Ionicons
                    name={themeVariant.stubIcon}
                    size={14}
                    color={themeVariant.stubIconColor}
                  />
                  <Text style={styles.codeChipText}>{stubCode ?? stubLabel}</Text>
                </View>
              </View>
            </>
          ) : null}

          {footer}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const CouponTearLine = ({ perfDotColor }: { perfDotColor: string }) => (
  <View style={styles.couponTearRow}>
    <View style={styles.couponSideNotchLeft} />
    <View style={styles.couponTearTrack}>
      {Array.from({ length: PERF_DOT_COUNT }).map((_, i) => (
        <View key={i} style={[styles.couponPerfDot, { backgroundColor: perfDotColor }]} />
      ))}
    </View>
    <View style={styles.couponSideNotchRight} />
  </View>
);

type FestiveOfferCouponProps = {
  variant: FestiveCouponVariant;
  offer: CartOffer;
  badgeLabel: string;
  appliedLabel: string;
  gapText?: string | null;
  stubLabel?: string | null;
};

export const FestiveOfferCoupon = ({
  variant,
  offer,
  badgeLabel,
  appliedLabel,
  gapText,
  stubLabel,
}: FestiveOfferCouponProps) => (
  <FestiveCouponShell
    variant={variant}
    badgeLabel={badgeLabel}
    applied={offer.applied}
    appliedLabel={appliedLabel}
    title={offer.title}
    subtitle={offer.subtitle}
    gapText={gapText}
    stubCode={offer.code ?? null}
    stubLabel={!offer.code ? stubLabel ?? null : null}
  />
);

const styles = StyleSheet.create({
  couponShell: {
    borderRadius: borderRadius.lg + 2,
    ...shadows.lg,
    shadowOpacity: 0.22,
  },
  couponGoldFrame: {
    borderRadius: borderRadius.lg + 2,
    padding: 3,
  },
  couponBodyGradient: {
    borderRadius: borderRadius.lg,
    paddingBottom: spacing.sm,
  },
  couponDecorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  couponGlowOrbLarge: {
    position: 'absolute',
    width: moderateScale(140, 0.35),
    height: moderateScale(140, 0.35),
    borderRadius: moderateScale(70, 0.35),
    top: -moderateScale(48, 0.35),
    right: -moderateScale(36, 0.35),
  },
  couponGlowOrbSmall: {
    position: 'absolute',
    width: moderateScale(72, 0.35),
    height: moderateScale(72, 0.35),
    borderRadius: moderateScale(36, 0.35),
    bottom: moderateScale(28, 0.35),
    left: -moderateScale(20, 0.35),
  },
  couponSparkleAccent: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
  },
  couponInsetPanel: {
    margin: spacing.sm,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 229, 102, 0.55)',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  featuredBadgeText: {
    fontSize: moderateScale(10, 0.35),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  appliedPillText: {
    fontSize: moderateScale(11, 0.35),
    fontWeight: '700',
    color: GREEN,
  },
  featuredTitle: {
    fontSize: moderateScale(18, 0.35),
    fontWeight: '800',
    color: colors.white,
  },
  featuredSub: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.92)',
  },
  featuredGap: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xxs,
  },
  couponTearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  couponSideNotchLeft: {
    width: COUPON_NOTCH_SIZE,
    height: COUPON_NOTCH_SIZE,
    borderRadius: COUPON_NOTCH_SIZE / 2,
    backgroundColor: CART_PAGE_BG,
    borderWidth: 2,
    borderColor: 'rgba(201, 162, 39, 0.85)',
    marginLeft: -COUPON_NOTCH_SIZE / 2,
  },
  couponSideNotchRight: {
    width: COUPON_NOTCH_SIZE,
    height: COUPON_NOTCH_SIZE,
    borderRadius: COUPON_NOTCH_SIZE / 2,
    backgroundColor: CART_PAGE_BG,
    borderWidth: 2,
    borderColor: 'rgba(201, 162, 39, 0.85)',
    marginRight: -COUPON_NOTCH_SIZE / 2,
  },
  couponTearTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
    minHeight: COUPON_NOTCH_SIZE,
  },
  couponPerfDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  codeStub: {
    alignItems: 'center',
    paddingTop: spacing.xxs,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 229, 102, 0.75)',
    borderStyle: 'dashed',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  codeChipText: {
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FFF8DC',
    fontSize: moderateScale(14, 0.35),
  },
});

export const festiveCouponModalStyles = StyleSheet.create({
  checkRingOuter: {
    alignSelf: 'center',
    width: moderateScale(64, 0.35),
    height: moderateScale(64, 0.35),
    borderRadius: moderateScale(32, 0.35),
    borderWidth: 2,
    borderColor: 'rgba(255, 229, 102, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  checkRingInner: {
    width: moderateScale(48, 0.35),
    height: moderateScale(48, 0.35),
    borderRadius: moderateScale(24, 0.35),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLine: {
    fontSize: moderateScale(20, 0.35),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  extraLine: {
    fontSize: moderateScale(12, 0.35),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  timerTrack: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.md,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#FFF8DC',
    borderRadius: 2,
  },
});
