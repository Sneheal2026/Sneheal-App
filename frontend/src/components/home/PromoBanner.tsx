import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
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

interface PromoSlide {
  id: string;
  code: string;
  urgency: string;
  title: string;
  cta: string;
  imageUri: string;
  overlay: [string, string];
  decorImage: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: '1',
    code: 'SNEHEAL40',
    urgency: 'Hurry, offer ends soon!',
    title: 'Get 40% off Your First Order!',
    cta: 'Order Now',
    imageUri: 'https://images.unsplash.com/photo-1587854692152-cfb097b3922a?w=800&q=80',
    overlay: ['rgba(234, 88, 12, 0.9)', 'rgba(180, 55, 8, 0.93)'],
    decorImage: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
  },
  {
    id: '2',
    code: 'FREEDEL',
    urgency: 'Limited time delivery offer',
    title: 'Free Delivery on Orders Above ₹499',
    cta: 'Shop Now',
    imageUri: 'https://images.unsplash.com/photo-1631549916768-4119b2d16785?w=800&q=80',
    overlay: ['rgba(13, 148, 136, 0.9)', 'rgba(15, 118, 110, 0.93)'],
    decorImage: 'https://cdn-icons-png.flaticon.com/512/3174/3174780.png',
  },
  {
    id: '3',
    code: 'RXEASY',
    urgency: 'Upload & order in minutes',
    title: 'Upload Rx & Get Medicines Fast',
    cta: 'Upload Rx',
    imageUri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    overlay: ['rgba(26, 115, 232, 0.9)', 'rgba(21, 88, 176, 0.93)'],
    decorImage: 'https://cdn-icons-png.flaticon.com/512/2920/2920306.png',
  },
  {
    id: '4',
    code: 'LAB20',
    urgency: 'Book today, save more',
    title: '20% Off on Full Body Checkups',
    cta: 'Book Test',
    imageUri: 'https://images.unsplash.com/photo-1579684272160-0ff8e7f458f1?w=800&q=80',
    overlay: ['rgba(91, 46, 145, 0.9)', 'rgba(67, 32, 110, 0.93)'],
    decorImage: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
  },
  {
    id: '5',
    code: 'SNEPLUS',
    urgency: 'Exclusive member benefits',
    title: 'Join Sneheal Plus & Save More',
    cta: 'Join Now',
    imageUri: 'https://images.unsplash.com/photo-1584308664894-6d09c1f84d07?w=800&q=80',
    overlay: ['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.93)'],
    decorImage: 'https://cdn-icons-png.flaticon.com/512/3174/3174780.png',
  },
];

const SLIDE_COUNT = PROMO_SLIDES.length;
const MAX_TRANSLATE = -(SLIDE_COUNT - 1) * ITEM_STRIDE;

const LOOP_SLIDES: PromoSlide[] = [...PROMO_SLIDES, PROMO_SLIDES[0]];

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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patternWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    top: -40,
    width: 1,
    height: '160%',
    backgroundColor: colors.white,
    transform: [{ rotate: '28deg' }],
  },
  patternDots: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    opacity: 0.9,
  },
  patternDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  slideBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  textBlock: {
    flex: 1,
    paddingRight: spacing.xs,
    zIndex: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  codePrefix: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  codeSuffix: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  codeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.3,
  },
  urgency: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: colors.white,
    lineHeight: moderateScale(22),
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },
  decorImage: {
    width: moderateScale(88),
    height: moderateScale(88),
    marginTop: spacing.xs,
    opacity: 0.95,
  },
  ctaButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    zIndex: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: colors.accentGold,
    letterSpacing: 0.2,
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
    width: 16,
    backgroundColor: colors.primary,
  },
});

const PATTERN_OVERLAY = (
  <View style={styles.patternWrap} pointerEvents="none">
    {Array.from({ length: 10 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.patternLine,
          { left: i * 34 - 12, opacity: 0.05 + (i % 2) * 0.03 },
        ]}
      />
    ))}
    <View style={styles.patternDots}>
      {Array.from({ length: 24 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.patternDot,
            { opacity: i % 3 === 0 ? 0.14 : 0.07 },
          ]}
        />
      ))}
    </View>
  </View>
);

const PromoSlideCard = React.memo(({ slide }: { slide: PromoSlide }) => (
  <View style={styles.slide}>
    <Image
      source={{ uri: slide.imageUri }}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
    <LinearGradient
      colors={slide.overlay}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.9 }}
      style={StyleSheet.absoluteFill}
    />
    {PATTERN_OVERLAY}

    <View style={styles.slideBody}>
      <View style={styles.textBlock}>
        <View style={styles.codeRow}>
          <Text style={styles.codePrefix}>Use code </Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{slide.code}</Text>
          </View>
        </View>
        <Text style={styles.codeSuffix}>at checkout</Text>
        <Text style={styles.urgency}>{slide.urgency}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {slide.title}
        </Text>
      </View>

      <Image
        source={{ uri: slide.decorImage }}
        style={styles.decorImage}
        resizeMode="contain"
      />
    </View>

    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88}>
      <Text style={styles.ctaText}>{slide.cta}</Text>
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
                  index === activeIndex && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default React.memo(PromoBanner);
