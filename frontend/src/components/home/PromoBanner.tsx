import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SIDE_INSET = spacing.xl;
const PEEK = spacing.lg;
const BANNER_WIDTH = SCREEN_WIDTH;
const BANNER_HEIGHT = moderateScale(172);
const SLIDE_GAP = spacing.md;
const SLIDE_WIDTH = SCREEN_WIDTH - SIDE_INSET - PEEK;
const ITEM_STRIDE = SLIDE_WIDTH + SLIDE_GAP;
const AUTO_PLAY_MS = 3600;
const SCROLL_DURATION = 1300;
const SMOOTH_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const VELOCITY_THRESHOLD = 450;

const PROMO_IMAGES = {
  vitamins: require('../../../assets/images/Vitamins-Minerals.png'),
  nutrition: require('../../../assets/images/Nutrition-Drinks.png'),
  prescription: require('../../../assets/images/Sneheal-Pill-2.webp'),
  fitness: require('../../../assets/images/Fitness.png'),
  ayurveda: require('../../../assets/images/Ayurveda.png'),
} as const;

interface PromoSlide {
  id: string;
  code: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  image: ImageSourcePropType;
  gradient: [string, string, string];
  glowColor: string;
  badgeTextColor: string;
  accentSoft: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: '1',
    code: 'SNEHEAL40',
    eyebrow: 'New Customer Offer',
    title: 'Save 40% on Your First Pharmacy Order',
    subtitle: 'Verified medicines · Licensed pharmacists · Fast doorstep delivery',
    cta: 'Shop Medicines',
    image: PROMO_IMAGES.vitamins,
    gradient: ['#0A2F6B', '#1A73E8', '#1247A8'],
    glowColor: 'rgba(74, 156, 245, 0.45)',
    badgeTextColor: '#1558B0',
    accentSoft: 'rgba(255,255,255,0.14)',
  },
  {
    id: '2',
    code: 'FREEDEL',
    eyebrow: 'Delivery Benefit',
    title: 'Free Delivery on Orders Above ₹499',
    subtitle: 'Essential healthcare products delivered safely to your home',
    cta: 'Browse Essentials',
    image: PROMO_IMAGES.nutrition,
    gradient: ['#064E45', '#0D9488', '#0F766E'],
    glowColor: 'rgba(45, 212, 191, 0.4)',
    badgeTextColor: '#0F766E',
    accentSoft: 'rgba(255,255,255,0.12)',
  },
  {
    id: '3',
    code: 'RXEASY',
    eyebrow: 'Digital Prescription',
    title: 'Upload Your Rx. We Dispense With Care.',
    subtitle: 'Secure upload · Pharmacist review · Ready in minutes',
    cta: 'Upload Prescription',
    image: PROMO_IMAGES.prescription,
    gradient: ['#0C4A6E', '#0369A1', '#1558B0'],
    glowColor: 'rgba(56, 189, 248, 0.38)',
    badgeTextColor: '#0369A1',
    accentSoft: 'rgba(255,255,255,0.13)',
  },
  {
    id: '4',
    code: 'LAB20',
    eyebrow: 'Preventive Health',
    title: '20% Off Full Body Health Checkups',
    subtitle: 'Trusted diagnostic partners · Accurate reports · Home collection',
    cta: 'Book Screening',
    image: PROMO_IMAGES.fitness,
    gradient: ['#3B0764', '#5B2E91', '#6D28D9'],
    glowColor: 'rgba(167, 139, 250, 0.42)',
    badgeTextColor: '#5B2E91',
    accentSoft: 'rgba(255,255,255,0.11)',
  },
  {
    id: '5',
    code: 'SNEPLUS',
    eyebrow: 'Sneheal Plus Membership',
    title: 'Priority Care & Exclusive Member Savings',
    subtitle: 'Member-only pricing · Free delivery · Wellness rewards',
    cta: 'View Benefits',
    image: PROMO_IMAGES.ayurveda,
    gradient: ['#064E3B', '#059669', '#047857'],
    glowColor: 'rgba(52, 211, 153, 0.4)',
    badgeTextColor: '#047857',
    accentSoft: 'rgba(255,255,255,0.12)',
  },
];

const SLIDE_COUNT = PROMO_SLIDES.length;
const MAX_TRANSLATE = -(SLIDE_COUNT - 1) * ITEM_STRIDE;

const LOOP_SLIDES: PromoSlide[] = [...PROMO_SLIDES, PROMO_SLIDES[0]];

const SlideBackdrop = React.memo(({ slide }: { slide: PromoSlide }) => (
  <View style={styles.backdropWrap} pointerEvents="none">
    <LinearGradient
      colors={slide.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />

    <View style={[styles.glowOrb, styles.glowOrbPrimary, { backgroundColor: slide.glowColor }]} />
    <View style={[styles.glowOrb, styles.glowOrbSecondary, { backgroundColor: slide.accentSoft }]} />

    {Array.from({ length: 8 }).map((_, i) => (
      <View
        key={`line-${i}`}
        style={[
          styles.meshLine,
          {
            left: i * 38 - 18,
            opacity: 0.04 + (i % 2) * 0.025,
          },
        ]}
      />
    ))}

    <View style={styles.crossGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`cross-${i}`} style={[styles.medicalCross, { opacity: 0.06 + (i % 2) * 0.04 }]}>
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
      ))}
    </View>

    <View style={styles.dotGrid}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View
          key={`dot-${i}`}
          style={[
            styles.backdropDot,
            { opacity: i % 4 === 0 ? 0.18 : 0.08 },
          ]}
        />
      ))}
    </View>

    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.22)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.bottomVignette}
    />
    <View style={styles.shineStreak} />
  </View>
));

SlideBackdrop.displayName = 'SlideBackdrop';

const PromoSlideCard = React.memo(({ slide }: { slide: PromoSlide }) => (
  <View style={styles.slide}>
    <SlideBackdrop slide={slide} />

    <View style={styles.slideBody}>
      <View style={styles.textBlock}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {slide.title}
        </Text>

        <Text style={styles.subtitle} numberOfLines={2}>
          {slide.subtitle}
        </Text>

        <View style={styles.codeChip}>
          <Text style={styles.codeChipLabel}>Promo code</Text>
          <View style={styles.codeBadge}>
            <Text style={[styles.codeText, { color: slide.badgeTextColor }]}>{slide.code}</Text>
          </View>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <View style={[styles.heroAura, { backgroundColor: slide.glowColor }]} />
        <View style={[styles.heroRing, { borderColor: slide.accentSoft }]} />
        <View style={styles.heroPlate}>
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.06)']}
            style={styles.heroPlateSheen}
          />
          <Image source={slide.image} style={styles.heroImage} resizeMode="contain" />
        </View>
      </View>
    </View>

    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88}>
      <LinearGradient
        colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.88)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaGradient}
      >
        <Text style={[styles.ctaText, { color: slide.badgeTextColor }]}>{slide.cta}</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
));

PromoSlideCard.displayName = 'PromoSlideCard';

interface PromoBannerProps {
  isScrolling?: boolean;
}

const PromoBanner = ({ isScrolling = false }: PromoBannerProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const visualIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isScrollingRef = useRef(isScrolling);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceForwardRef = useRef<() => void>(() => {});
  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  isScrollingRef.current = isScrolling;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAutoPlay = useCallback(() => {
    if (isScrollingRef.current) return;

    clearTimer();
    timerRef.current = setTimeout(() => {
      advanceForwardRef.current();
    }, AUTO_PLAY_MS);
  }, [clearTimer]);

  const handleSettled = useCallback((index: number) => {
    visualIndexRef.current = index;
    isAnimatingRef.current = false;
    setActiveIndex(index);
    scheduleAutoPlay();
  }, [scheduleAutoPlay]);

  const handleSettledRef = useRef(handleSettled);
  handleSettledRef.current = handleSettled;

  const settleSlide = useCallback((index: number) => {
    handleSettledRef.current(index);
  }, []);

  const snapToIndex = useCallback((targetIndex: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, targetIndex));
    const fromIndex = visualIndexRef.current;

    isAnimatingRef.current = true;
    clearTimer();
    setActiveIndex(clamped);

    translateX.value = withTiming(
      -clamped * ITEM_STRIDE,
      {
        duration: SCROLL_DURATION,
        easing: SMOOTH_EASING,
      },
      (finished) => {
        'worklet';
        runOnJS(settleSlide)(finished ? clamped : fromIndex);
      },
    );
  }, [translateX, clearTimer, settleSlide]);

  const snapToIndexRef = useRef(snapToIndex);
  snapToIndexRef.current = snapToIndex;

  const onDragStart = useCallback(() => {
    clearTimer();
    isAnimatingRef.current = true;
  }, [clearTimer]);

  const handlePanEnd = useCallback((currentX: number, velocityX: number) => {
    const rawIndex = -currentX / ITEM_STRIDE;
    let targetIndex: number;

    if (Math.abs(velocityX) > VELOCITY_THRESHOLD) {
      targetIndex = velocityX < 0
        ? Math.ceil(rawIndex - 0.12)
        : Math.floor(rawIndex + 0.12);
    } else {
      targetIndex = Math.round(rawIndex);
    }

    snapToIndexRef.current(targetIndex);
  }, []);

  const panGesture = useMemo(
    () => Gesture.Pan()
      .activeOffsetX([-14, 14])
      .failOffsetY([-12, 12])
      .onStart(() => {
        'worklet';
        cancelAnimation(translateX);
        dragStartX.value = translateX.value;
        runOnJS(onDragStart)();
      })
      .onUpdate((event) => {
        'worklet';
        const next = dragStartX.value + event.translationX;
        translateX.value = Math.min(0, Math.max(MAX_TRANSLATE, next));
      })
      .onEnd((event) => {
        'worklet';
        runOnJS(handlePanEnd)(translateX.value, event.velocityX);
      })
      .onFinalize((_event, success) => {
        'worklet';
        if (!success) {
          runOnJS(handlePanEnd)(translateX.value, 0);
        }
      }),
    [onDragStart, handlePanEnd, translateX, dragStartX],
  );

  const advanceForward = useCallback(() => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    clearTimer();

    const fromIndex = visualIndexRef.current;
    const nextVisual = fromIndex + 1;
    const previewIndex = nextVisual >= SLIDE_COUNT ? 0 : nextVisual;

    setActiveIndex(previewIndex);

    translateX.value = withTiming(
      -nextVisual * ITEM_STRIDE,
      {
        duration: SCROLL_DURATION,
        easing: SMOOTH_EASING,
      },
      (finished) => {
        'worklet';
        if (!finished) {
          runOnJS(settleSlide)(fromIndex);
          return;
        }

        if (nextVisual >= SLIDE_COUNT) {
          translateX.value = 0;
          runOnJS(settleSlide)(0);
        } else {
          runOnJS(settleSlide)(nextVisual);
        }
      },
    );
  }, [translateX, clearTimer, settleSlide]);

  advanceForwardRef.current = advanceForward;

  const goToSlide = useCallback((targetIndex: number) => {
    if (isAnimatingRef.current || targetIndex === visualIndexRef.current) return;
    snapToIndex(targetIndex);
  }, [snapToIndex]);

  useEffect(() => {
    if (isScrolling) {
      clearTimer();
      return;
    }

    if (!isAnimatingRef.current) {
      scheduleAutoPlay();
    }

    return () => clearTimer();
  }, [isScrolling, clearTimer, scheduleAutoPlay]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeAccent = PROMO_SLIDES[activeIndex]?.badgeTextColor ?? colors.primary;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.carouselViewport}>
          <Animated.View style={[styles.carouselTrack, trackStyle]}>
            {LOOP_SLIDES.map((slide, index) => (
              <View key={`${slide.id}-${index}`} style={styles.slideWrapper}>
                <PromoSlideCard slide={slide} />
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.progressRow}>
        <View style={styles.dotsRow}>
          {PROMO_SLIDES.map((slide, index) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => goToSlide(index)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View
                style={[
                  styles.dot,
                  index === activeIndex && [styles.dotActive, { backgroundColor: activeAccent }],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  carouselViewport: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  carouselTrack: {
    flexDirection: 'row',
    height: BANNER_HEIGHT,
    paddingLeft: SIDE_INSET,
  },
  slideWrapper: {
    width: SLIDE_WIDTH,
    height: BANNER_HEIGHT,
    marginRight: SLIDE_GAP,
  },
  slide: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbPrimary: {
    width: moderateScale(160),
    height: moderateScale(160),
    top: -moderateScale(52),
    right: -moderateScale(28),
  },
  glowOrbSecondary: {
    width: moderateScale(96),
    height: moderateScale(96),
    bottom: -moderateScale(24),
    left: -moderateScale(18),
  },
  meshLine: {
    position: 'absolute',
    top: -48,
    width: 1,
    height: '170%',
    backgroundColor: colors.white,
    transform: [{ rotate: '24deg' }],
  },
  crossGrid: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 64,
    gap: 10,
  },
  medicalCross: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: colors.white,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.white,
  },
  dotGrid: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  backdropDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  shineStreak: {
    position: 'absolute',
    top: -20,
    left: '18%',
    width: moderateScale(42),
    height: '130%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ rotate: '18deg' }],
  },
  slideBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg + spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  textBlock: {
    flex: 1,
    paddingRight: spacing.xs,
    zIndex: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  eyebrow: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: colors.white,
    lineHeight: moderateScale(20),
    marginTop: spacing.sm,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: moderateScale(14),
    marginTop: spacing.xxs + 1,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  codeChipLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  codeBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  codeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroWrap: {
    width: moderateScale(98),
    height: moderateScale(98),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxs,
  },
  heroAura: {
    position: 'absolute',
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(46),
  },
  heroRing: {
    position: 'absolute',
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    borderWidth: 1.5,
  },
  heroPlate: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroPlateSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '84%',
    height: '84%',
  },
  ctaButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    zIndex: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
  },
  ctaText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 0.15,
  },
  progressRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});

export default React.memo(PromoBanner);
