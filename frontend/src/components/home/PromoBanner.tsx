import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  type ComponentProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Path, Polygon, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import type { AuthStackParamList, TabParamList } from '@/navigation/types';

const { colors, spacing, borderRadius, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SIDE_INSET = spacing.xl;
const PEEK = spacing.lg;
const BANNER_WIDTH = SCREEN_WIDTH;
const BANNER_HEIGHT = moderateScale(208);
const SLIDE_GAP = spacing.md;
const SLIDE_WIDTH = SCREEN_WIDTH - SIDE_INSET - PEEK;
const ITEM_STRIDE = SLIDE_WIDTH + SLIDE_GAP;
const AUTO_PLAY_MS = 3800;
const SCROLL_DURATION = 1300;
const SMOOTH_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const VELOCITY_THRESHOLD = 450;

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type PromoRoute =
  | 'MedicineScan'
  | 'Search'
  | 'EmergencyContacts'
  | 'MedicineReminders'
  | 'FamilyMembers';
type PatternKind = 'rx' | 'speed' | 'sos' | 'dose' | 'family';

interface PromoSlide {
  id: string;
  pattern: PatternKind;
  route: PromoRoute;
  icon: IoniconName;
  eyebrowKey: string;
  titleKey: string;
  detailKey: string;
  metaKey: string;
  ctaKey: string;
  gradient: [string, string, string];
  ink: string;
  inkSoft: string;
  ctaColor: string;
}

interface ResolvedSlide extends PromoSlide {
  eyebrow: string;
  title: string;
  detail: string;
  meta: string;
  cta: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'rx',
    pattern: 'rx',
    route: 'MedicineScan',
    icon: 'document-text',
    eyebrowKey: 'home.promoRxEyebrow',
    titleKey: 'home.promoRxTitle',
    detailKey: 'home.promoRxDetail',
    metaKey: 'home.promoRxMeta',
    ctaKey: 'home.promoRxCta',
    gradient: ['#1E3A8A', '#2563EB', '#38BDF8'],
    ink: '#DBEAFE',
    inkSoft: 'rgba(219, 234, 254, 0.28)',
    ctaColor: '#1D4ED8',
  },
  {
    id: 'speed',
    pattern: 'speed',
    route: 'Search',
    icon: 'flash',
    eyebrowKey: 'home.promoFastEyebrow',
    titleKey: 'home.promoFastTitle',
    detailKey: 'home.promoFastDetail',
    metaKey: 'home.promoFastMeta',
    ctaKey: 'home.promoFastCta',
    gradient: ['#115E59', '#0D9488', '#2DD4BF'],
    ink: '#CCFBF1',
    inkSoft: 'rgba(204, 251, 241, 0.28)',
    ctaColor: '#0F766E',
  },
  {
    id: 'sos',
    pattern: 'sos',
    route: 'EmergencyContacts',
    icon: 'call',
    eyebrowKey: 'home.promoSosEyebrow',
    titleKey: 'home.promoSosTitle',
    detailKey: 'home.promoSosDetail',
    metaKey: 'home.promoSosMeta',
    ctaKey: 'home.promoSosCta',
    gradient: ['#9F1239', '#E11D48', '#FB7185'],
    ink: '#FFE4E6',
    inkSoft: 'rgba(255, 228, 230, 0.3)',
    ctaColor: '#BE123C',
  },
  {
    id: 'dose',
    pattern: 'dose',
    route: 'MedicineReminders',
    icon: 'alarm',
    eyebrowKey: 'home.promoDoseEyebrow',
    titleKey: 'home.promoDoseTitle',
    detailKey: 'home.promoDoseDetail',
    metaKey: 'home.promoDoseMeta',
    ctaKey: 'home.promoDoseCta',
    gradient: ['#4C1D95', '#7C3AED', '#A78BFA'],
    ink: '#EDE9FE',
    inkSoft: 'rgba(237, 233, 254, 0.3)',
    ctaColor: '#6D28D9',
  },
  {
    id: 'family',
    pattern: 'family',
    route: 'FamilyMembers',
    icon: 'people',
    eyebrowKey: 'home.promoFamilyEyebrow',
    titleKey: 'home.promoFamilyTitle',
    detailKey: 'home.promoFamilyDetail',
    metaKey: 'home.promoFamilyMeta',
    ctaKey: 'home.promoFamilyCta',
    gradient: ['#9A3412', '#EA580C', '#FBBF24'],
    ink: '#FFEDD5',
    inkSoft: 'rgba(255, 237, 213, 0.32)',
    ctaColor: '#C2410C',
  },
];

const SLIDE_COUNT = PROMO_SLIDES.length;
const MAX_TRANSLATE = -(SLIDE_COUNT - 1) * ITEM_STRIDE;

const PatternRx = ({ ink, inkSoft }: { ink: string; inkSoft: string }) => (
  <G>
    {Array.from({ length: 12 }).map((_, i) => (
      <Line
        key={`hatch-${i}`}
        x1={i * 28 - 30}
        y1={-10}
        x2={i * 28 + 90}
        y2={200}
        stroke={ink}
        strokeWidth={1.4}
        opacity={0.22}
      />
    ))}
    <Rect x="168" y="18" width="92" height="118" rx="10" fill={inkSoft} transform="rotate(14 214 77)" />
    <Rect x="158" y="28" width="92" height="118" rx="10" fill={ink} opacity={0.22} transform="rotate(-8 204 87)" />
    <Rect x="150" y="34" width="92" height="118" rx="10" fill="rgba(255,255,255,0.16)" />
    <Line x1="166" y1="62" x2="226" y2="62" stroke={ink} strokeWidth={3} strokeDasharray="8 6" opacity={0.9} />
    <Line x1="166" y1="78" x2="218" y2="78" stroke="#fff" strokeWidth={3} strokeDasharray="8 6" opacity={0.55} />
    <Line x1="166" y1="94" x2="210" y2="94" stroke="#fff" strokeWidth={3} strokeDasharray="8 6" opacity={0.4} />
    {[{ x: 262, y: 28 }, { x: 286, y: 64 }, { x: 248, y: 148 }].map((plus) => (
      <G key={`${plus.x}-${plus.y}`}>
        <Rect x={plus.x} y={plus.y} width={5} height={18} rx={1} fill={ink} />
        <Rect x={plus.x - 6.5} y={plus.y + 6.5} width={18} height={5} rx={1} fill={ink} />
      </G>
    ))}
  </G>
);

const PatternSpeed = ({ ink, inkSoft }: { ink: string; inkSoft: string }) => (
  <G>
    {Array.from({ length: 7 }).map((_, i) => (
      <Path
        key={`chevron-${i}`}
        d={`M ${88 + i * 28} 8 L ${128 + i * 28} 90 L ${88 + i * 28} 172`}
        fill="none"
        stroke={i % 2 === 0 ? ink : inkSoft}
        strokeWidth={i === 3 ? 14 : 8}
        opacity={0.28 + (i % 3) * 0.08}
      />
    ))}
    {Array.from({ length: 8 }).map((_, i) => (
      <Rect
        key={`dash-${i}`}
        x={24 + i * 18}
        y={22 + (i % 3) * 46}
        width={28 + (i % 2) * 16}
        height={7}
        rx={1}
        fill={ink}
        opacity={0.35}
      />
    ))}
    <Polygon
      points="236,16 188,92 214,92 164,168 258,84 228,84"
      fill={ink}
      opacity={0.92}
    />
  </G>
);

const PatternSos = ({ ink, inkSoft }: { ink: string; inkSoft: string }) => (
  <G>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = ((112 + i * 13) * Math.PI) / 180;
      return (
        <Line
          key={`burst-${i}`}
          x1={318}
          y1={8}
          x2={318 + Math.cos(angle) * 240}
          y2={8 + Math.sin(angle) * 240}
          stroke={i % 2 === 0 ? ink : '#fff'}
          strokeWidth={i % 3 === 0 ? 7 : 3}
          opacity={0.24}
        />
      );
    })}
    <Polygon points="214,22 258,98 170,98" fill={ink} opacity={0.92} />
    <Polygon points="214,38 246,90 182,90" fill="#FF1744" />
    <Rect x="210" y="54" width="8" height="22" rx="1" fill={ink} />
    <Rect x="210" y="80" width="8" height="8" rx="1" fill={ink} />
    {Array.from({ length: 9 }).map((_, i) => (
      <Rect
        key={`pad-${i}`}
        x={236 + (i % 3) * 22}
        y={112 + Math.floor(i / 3) * 18}
        width={14}
        height={14}
        rx={2}
        fill={i === 4 ? ink : inkSoft}
        opacity={i === 4 ? 1 : 0.7}
      />
    ))}
  </G>
);

const PatternDose = ({ ink, inkSoft }: { ink: string; inkSoft: string }) => (
  <G>
    {Array.from({ length: 10 }).map((_, i) => (
      <Line
        key={`tick-${i}`}
        x1={40 + i * 28}
        y1={8}
        x2={40 + i * 28}
        y2={i % 2 === 0 ? 28 : 22}
        stroke={ink}
        strokeWidth={3}
        opacity={0.4}
      />
    ))}
    <Polygon points="176,22 254,8 268,42 190,56" fill={ink} opacity={0.92} />
    <Polygon points="176,22 214,16 222,46 184,52" fill="#fff" opacity={0.28} />
    <Polygon points="148,96 230,78 242,108 160,126" fill={inkSoft} />
    <Polygon points="148,96 188,88 194,112 154,120" fill={ink} opacity={0.7} />
    <Polygon points="236,128 298,116 306,140 244,152" fill="#fff" opacity={0.22} />
    {[{ x: 286, y: 22 }, { x: 54, y: 128 }, { x: 292, y: 148 }].map((plus) => (
      <G key={`${plus.x}-${plus.y}`} opacity={0.85}>
        <Rect x={plus.x} y={plus.y} width={5} height={16} rx={1} fill={ink} />
        <Rect x={plus.x - 5.5} y={plus.y + 5.5} width={16} height={5} rx={1} fill={ink} />
      </G>
    ))}
  </G>
);

const PatternFamily = ({ ink, inkSoft }: { ink: string; inkSoft: string }) => (
  <G>
    {Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 4 }).map((__, col) => {
        const x = 148 + col * 42 + (row % 2) * 21;
        const y = 8 + row * 36;
        return (
          <Polygon
            key={`dia-${row}-${col}`}
            points={`${x},${y} ${x + 18},${y + 16} ${x},${y + 32} ${x - 18},${y + 16}`}
            fill={col % 2 === 0 ? ink : inkSoft}
            opacity={0.22 + ((row + col) % 3) * 0.1}
          />
        );
      }),
    )}
    <Rect x="188" y="36" width="58" height="58" rx="8" fill={ink} opacity={0.85} transform="rotate(18 217 65)" />
    <Rect x="162" y="62" width="58" height="58" rx="8" fill="#fff" opacity={0.22} transform="rotate(-12 191 91)" />
    <Rect x="214" y="78" width="58" height="58" rx="8" fill={inkSoft} transform="rotate(8 243 107)" />
  </G>
);

const PATTERN_MAP: Record<
  PatternKind,
  React.ComponentType<{ ink: string; inkSoft: string }>
> = {
  rx: PatternRx,
  speed: PatternSpeed,
  sos: PatternSos,
  dose: PatternDose,
  family: PatternFamily,
};

const SlidePattern = React.memo(({ slide }: { slide: ResolvedSlide }) => {
  const Pattern = PATTERN_MAP[slide.pattern];

  return (
    <View style={styles.backdropWrap} pointerEvents="none">
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMaxYMid slice"
      >
        <Pattern ink={slide.ink} inkSoft={slide.inkSoft} />
      </Svg>
      <LinearGradient
        colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0.12)', 'transparent']}
        locations={[0, 0.42, 0.78]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

SlidePattern.displayName = 'SlidePattern';

const PromoSlideCard = React.memo(
  ({ slide, onPress }: { slide: ResolvedSlide; onPress: (route: PromoRoute) => void }) => (
    <Pressable
      onPress={() => onPress(slide.route)}
      style={styles.slide}
      accessibilityRole="button"
      accessibilityLabel={`${slide.title}. ${slide.detail}`}
    >
      <SlidePattern slide={slide} />

      <View style={styles.slideInner}>
        <View style={styles.topRow}>
          <View style={[styles.eyebrowChip, { borderColor: slide.inkSoft }]}>
            <View style={[styles.eyebrowMark, { backgroundColor: slide.ink }]} />
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          </View>

          <View style={[styles.markPlate, { borderColor: slide.ink }]}>
            <View style={styles.markInner}>
              <Ionicons name={slide.icon} size={moderateScale(18)} color={colors.white} />
            </View>
          </View>
        </View>

        <View style={styles.copyStack}>
          <Text style={styles.title} numberOfLines={2}>
            {slide.title}
          </Text>
          <Text style={styles.detail} numberOfLines={2}>
            {slide.detail}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{slide.meta}</Text>
          </View>

          <View style={styles.ctaButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.88)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, { color: slide.ctaColor }]} numberOfLines={1}>
                {slide.cta}
              </Text>
              <View style={[styles.ctaIcon, { backgroundColor: slide.ctaColor }]}>
                <Ionicons name="arrow-forward" size={moderateScale(12)} color={colors.white} />
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Pressable>
  ),
);

PromoSlideCard.displayName = 'PromoSlideCard';

interface PromoBannerProps {
  isScrolling?: boolean;
}

const PromoBanner = ({ isScrolling = false }: PromoBannerProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Home'>>();
  const [activeIndex, setActiveIndex] = useState(0);
  const visualIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isScrollingRef = useRef(isScrolling);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceForwardRef = useRef<() => void>(() => {});
  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  isScrollingRef.current = isScrolling;

  const slides = useMemo<ResolvedSlide[]>(
    () =>
      PROMO_SLIDES.map((slide) => ({
        ...slide,
        eyebrow: t(slide.eyebrowKey),
        title: t(slide.titleKey),
        detail: t(slide.detailKey),
        meta: t(slide.metaKey),
        cta: t(slide.ctaKey),
      })),
    [t],
  );

  const loopSlides = useMemo(() => [...slides, slides[0]], [slides]);

  const handleSlidePress = useCallback(
    (route: PromoRoute) => {
      if (route === 'Search') {
        navigation.navigate('Search');
        return;
      }
      const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
      parent?.navigate(route);
    },
    [navigation],
  );

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

  const activeInk = slides[activeIndex]?.ink ?? colors.primary;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.carouselViewport}>
          <Animated.View style={[styles.carouselTrack, trackStyle]}>
            {loopSlides.map((slide, index) => (
              <View key={`${slide.id}-${index}`} style={styles.slideWrapper}>
                <PromoSlideCard slide={slide} onPress={handleSlidePress} />
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.progressRow}>
        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <Pressable
              key={slide.id}
              onPress={() => goToSlide(index)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={slide.title}
            >
              <View
                style={[
                  styles.dot,
                  index === activeIndex && [styles.dotActive, { backgroundColor: activeInk }],
                ]}
              />
            </Pressable>
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 7,
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  slideInner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
  },
  eyebrowMark: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
  eyebrow: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  copyStack: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
    marginVertical: spacing.xs,
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: colors.white,
    lineHeight: moderateScale(26),
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  detail: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: moderateScale(17),
    includeFontPadding: false,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaChip: {
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  markPlate: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.22)',
    transform: [{ rotate: '10deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInner: {
    transform: [{ rotate: '-10deg' }],
  },
  ctaButton: {
    flexShrink: 0,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
    gap: spacing.xs + 2,
  },
  ctaText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  ctaIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});

export default React.memo(PromoBanner);
