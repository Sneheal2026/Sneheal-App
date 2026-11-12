import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

const PRODUCT_IMAGES = [
  require('../../../assets/images/Splash_Pill.webp'),
  require('../../../assets/images/Splash_Bottle.webp'),
];

const MANDALA_IMAGE = require('../../../assets/images/Splash_Mandala_Diwali.webp');
const LANTERN_LEFT_IMAGE = require('../../../assets/images/Splash_Lantern.webp');
const LANTERN_RIGHT_IMAGE = require('../../../assets/images/Splash_Lantern_Right.webp');
const GARLAND_IMAGE = require('../../../assets/images/Splash_Lights_Garland.webp');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Circular mandala: reduced size and width to sit comfortably inside header
const MANDALA_SIZE = Math.min(Math.max(SCREEN_WIDTH * 0.74, 250), 320);

// Lantern dimensions: reduced size and width to remain elegant & proportional
// Aspect ratio of Splash_Lantern is 159 x 311 (~0.511)
const LANTERN_HEIGHT = Math.min(Math.max(SCREEN_WIDTH * 0.33, 115), 145);
const LANTERN_WIDTH = Math.round(LANTERN_HEIGHT * (159 / 311));

// Fairy lights garland spanning full top edge (866 x 232 aspect ratio ~0.268)
const GARLAND_HEIGHT = Math.round(SCREEN_WIDTH * (232 / 866));

// Canvas sizing
const STAGE_SIZE = 260;
const HALF_STAGE = STAGE_SIZE / 2;
const PRODUCT_SIZE = 120;

// Ellipse orbit parameters (in circular un-projected coordinates)
const SVG_CENTER = 110;
const ORBIT_RADIUS = 76;

/**
 * Helper to compute an SVG arc path between two angles (degrees)
 */
const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) => {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180.0;
  const startRad = toRad(endAngle);
  const endRad = toRad(startAngle);

  const start = {
    x: cx + r * Math.cos(startRad),
    y: cy + r * Math.sin(startRad),
  };
  const end = {
    x: cx + r * Math.cos(endRad),
    y: cy + r * Math.sin(endRad),
  };

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
};

/**
 * Pure SVG containing the two revolving arcs with Head-to-Tail pink gradients:
 * 1. Primary Arc: Vibrant hot-pink head (#FF1F6D) fading towards a translucent blush tail (#FFAEC8)
 * 2. Secondary Arc: Glowing pink head (#FF2D78) fading towards a soft pastel tail (#FFD1E3)
 */
const OrbitSvg = () => {
  // Arc 1: 110° span (thick primary front arc)
  const arc1Path = describeArc(SVG_CENTER, SVG_CENTER, ORBIT_RADIUS, 15, 125);
  // Arc 2: 110° span on opposite side (secondary back arc)
  const arc2Path = describeArc(SVG_CENTER, SVG_CENTER, ORBIT_RADIUS, 195, 305);

  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        {/* Arc 1 Glow Trail Gradient (Head: 172.25, 153.59 -> Tail: 129.67, 36.59) */}
        <LinearGradient
          id="arc1GlowGrad"
          x1="172.25"
          y1="153.59"
          x2="129.67"
          y2="36.59"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FF1F6D" stopOpacity="0.30" />
          <Stop offset="60%" stopColor="#FF6B9E" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#FFAEC8" stopOpacity="0.0" />
        </LinearGradient>

        {/* Arc 1 Main Stroke Gradient */}
        <LinearGradient
          id="arc1MainGrad"
          x1="172.25"
          y1="153.59"
          x2="129.67"
          y2="36.59"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FF1F6D" stopOpacity="1" />
          <Stop offset="40%" stopColor="#FF4789" stopOpacity="0.95" />
          <Stop offset="75%" stopColor="#FF82AD" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#FFAEC8" stopOpacity="0.12" />
        </LinearGradient>

        {/* Arc 2 Stroke Gradient (Head: 47.75, 66.41 -> Tail: 90.33, 183.41) */}
        <LinearGradient
          id="arc2MainGrad"
          x1="47.75"
          y1="66.41"
          x2="90.33"
          y2="183.41"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FF2D78" stopOpacity="0.95" />
          <Stop offset="45%" stopColor="#FF659B" stopOpacity="0.75" />
          <Stop offset="80%" stopColor="#FFA5C5" stopOpacity="0.40" />
          <Stop offset="100%" stopColor="#FFD1E3" stopOpacity="0.10" />
        </LinearGradient>
      </Defs>

      <G>
        {/* Soft neon glow aura under Arc 1 */}
        <Path
          d={arc1Path}
          stroke="url(#arc1GlowGrad)"
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
        />
        {/* Arc 1 main stroke */}
        <Path
          d={arc1Path}
          stroke="url(#arc1MainGrad)"
          strokeWidth={5.8}
          strokeLinecap="round"
          fill="none"
        />
        {/* Arc 2 secondary stroke */}
        <Path
          d={arc2Path}
          stroke="url(#arc2MainGrad)"
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};

/**
 * Organic layered fluid waves flowing along the bottom screen edge
 * Recreated from user reference design with soft translucent pink gradients
 */
const BottomWaves = () => {
  return (
    <View pointerEvents="none" style={styles.bottomWavesContainer}>
      <Svg width="100%" height={95} viewBox="0 0 1000 130" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bottomWaveGrad1" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FD84BA" stopOpacity="0.45" />
            <Stop offset="50%" stopColor="#FE9CC5" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FDB3D7" stopOpacity="0.08" />
          </LinearGradient>
          <LinearGradient id="bottomWaveGrad2" x1="0" y1="1" x2="0.8" y2="0">
            <Stop offset="0%" stopColor="#F43F5E" stopOpacity="0.30" />
            <Stop offset="60%" stopColor="#FD84BA" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="bottomWaveGrad3" x1="0.2" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.75" />
            <Stop offset="60%" stopColor="#FDF2F8" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient broad wave (Layer 1 - deepest) */}
        <Path
          d="M 0 35 C 130 18, 280 25, 420 52 C 540 76, 700 82, 850 20 C 910 10, 960 16, 1000 28 L 1000 130 L 0 130 Z"
          fill="url(#bottomWaveGrad3)"
        />

        {/* Soft pastel pink flowing ribbon (Layer 2) */}
        <Path
          d="M 0 55 C 140 38, 290 44, 430 72 C 550 96, 710 102, 860 40 C 920 30, 970 36, 1000 48 L 1000 130 L 0 130 Z"
          fill="url(#bottomWaveGrad1)"
        />

        {/* Vibrant rose crest curve (Layer 3 - front accent) */}
        <Path
          d="M 0 76 C 150 58, 300 64, 440 90 C 560 114, 720 120, 870 60 C 930 50, 980 56, 1000 68 L 1000 130 L 0 130 Z"
          fill="url(#bottomWaveGrad2)"
        />
      </Svg>
    </View>
  );
};

/**
 * 4-Segmented Progress Indicator Pills (== -- -- --)
 */
const SegmentedProgressBar = ({ activeIndex }: { activeIndex: number }) => {
  return (
    <View style={styles.segmentedRow}>
      {[0, 1, 2, 3].map((idx) => {
        const isActive = idx <= activeIndex;
        return (
          <View
            key={idx}
            style={[
              styles.segmentPill,
              isActive ? styles.segmentPillActive : styles.segmentPillInactive,
            ]}
          />
        );
      })}
    </View>
  );
};

const SessionRestoreVisual = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // 0. Continuous 360° rotation of the top background mandala (festive circular motion)
  const mandalaRotation = useSharedValue(0);

  // Subtle organic pendulum sway for left and right hanging lanterns
  const leftLanternSway = useSharedValue(0);
  const rightLanternSway = useSharedValue(0);

  // Subtle warm glow twinkle for fairy lights garland
  const garlandGlow = useSharedValue(1);

  // 1. Continuous 360° orbital revolution of the arcs
  const orbitRotation = useSharedValue(0);

  // 2. Gentle vertical bobbing / floating of the center product
  const floatVal = useSharedValue(0);

  // 3. Smooth cross-fade between Splash_Pill and Splash_Bottle
  const switchVal = useSharedValue(0);

  // 4. Segmented progress step (0 to 3)
  const [activeStep, setActiveStep] = React.useState(1);

  useEffect(() => {
    // 0. Slow, continuous circular motion for the top mandala
    mandalaRotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false,
    );

    // Subtle pendulum swing for left hanging lanterns (-2.4deg to +2.4deg)
    leftLanternSway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    // Subtle pendulum swing for right hanging lanterns (slightly offset duration & phase)
    rightLanternSway.value = withDelay(
      350,
      withRepeat(
        withSequence(
          withTiming(-1, { duration: 2900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 2900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    // Subtle fairy lights warm glow breathing effect
    garlandGlow.value = withRepeat(
      withSequence(
        withTiming(0.86, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    // 1. Continuous linear revolution
    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 3400, easing: Easing.linear }),
      -1,
      false,
    );

    // 2. Float up & down smoothly
    floatVal.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    // 3. Snappy product carousel switch (shows both items smoothly within ~2s)
    switchVal.value = withRepeat(
      withSequence(
        withDelay(850, withTiming(1, { duration: 420, easing: Easing.inOut(Easing.cubic) })),
        withDelay(850, withTiming(0, { duration: 420, easing: Easing.inOut(Easing.cubic) })),
      ),
      -1,
      false,
    );

    // 4. Segmented pill loader step animation
    const progressTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 550);

    return () => {
      cancelAnimation(mandalaRotation);
      cancelAnimation(leftLanternSway);
      cancelAnimation(rightLanternSway);
      cancelAnimation(garlandGlow);
      cancelAnimation(orbitRotation);
      cancelAnimation(floatVal);
      cancelAnimation(switchVal);
      clearInterval(progressTimer);
    };
  }, [mandalaRotation, leftLanternSway, rightLanternSway, garlandGlow, orbitRotation, floatVal, switchVal]);

  // Top mandala slow continuous circular rotation style
  const animatedMandalaStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${mandalaRotation.value}deg` }],
  }));

  // Fairy lights garland gentle twinkle style
  const animatedGarlandStyle = useAnimatedStyle(() => ({
    opacity: garlandGlow.value,
  }));

  // Left lantern pendulum sway (anchored at top)
  const animatedLeftLanternStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(leftLanternSway.value, [-1, 1], [-1.2, 1.2]) },
      { rotateZ: `${interpolate(leftLanternSway.value, [-1, 1], [-2.4, 2.4])}deg` },
    ],
  }));

  // Right lantern pendulum sway (anchored at top)
  const animatedRightLanternStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(rightLanternSway.value, [-1, 1], [-1.2, 1.2]) },
      { rotateZ: `${interpolate(rightLanternSway.value, [-1, 1], [-2.4, 2.4])}deg` },
    ],
  }));

  // Orbit rotating transform
  const animatedOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${orbitRotation.value}deg` }],
  }));

  // Float transform for the product container
  const animatedProductFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatVal.value, [-1, 1], [-7, 7]) }],
  }));

  // Image 1 (Splash_Pill) cross-fade style
  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(switchVal.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(switchVal.value, [0, 1], [1, 0.84]) }],
  }));

  // Image 2 (Splash_Bottle) cross-fade style
  const animatedBottleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(switchVal.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(switchVal.value, [0, 1], [0.84, 1]) }],
  }));

  /**
   * Render either the back or front half of the revolving 3D orbit:
   * - Back half: rendered behind the medicine (zIndex: 1)
   * - Front half: rendered in front of the medicine (zIndex: 20)
   */
  const renderOrbitHalf = (isFront: boolean) => (
    <View
      pointerEvents="none"
      style={[
        styles.orbitPerspectiveContainer,
        { zIndex: isFront ? 20 : 1 },
      ]}
    >
      <View
        style={[
          styles.orbitClipWindow,
          { top: isFront ? HALF_STAGE : 0 },
        ]}
      >
        <View
          style={[
            styles.orbitForeshortenLayer,
            { top: isFront ? -HALF_STAGE : 0 },
          ]}
        >
          <Animated.View style={[styles.orbitSpinner, animatedOrbitStyle]}>
            <OrbitSvg />
          </Animated.View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* 1. Top Center Half-Exposed Rotating Background Mandala */}
      <View pointerEvents="none" style={styles.topMandalaWrapper}>
        <Animated.Image
          source={MANDALA_IMAGE}
          style={[styles.topMandala, animatedMandalaStyle]}
          resizeMode="contain"
        />
      </View>

      {/* 2. Top Edge Hanging Fairy Lights Garland */}
      <Animated.View pointerEvents="none" style={[styles.garlandWrapper, animatedGarlandStyle]}>
        <Animated.Image
          source={GARLAND_IMAGE}
          style={styles.garlandImage}
          resizeMode="stretch"
        />
      </Animated.View>

      {/* 3. Left Hanging Lanterns (Gentle Pendulum Sway) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.leftLanternWrapper, animatedLeftLanternStyle]}
      >
        <Animated.Image
          source={LANTERN_LEFT_IMAGE}
          style={styles.lanternImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* 4. Right Hanging Lanterns - Mirrored (Gentle Pendulum Sway) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.rightLanternWrapper, animatedRightLanternStyle]}
      >
        <Animated.Image
          source={LANTERN_RIGHT_IMAGE}
          style={styles.lanternImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Visual Animation Stage */}
      <View style={styles.stage}>
        {/* 1. Orbit Arc Layer (Back half - behind product) */}
        {renderOrbitHalf(false)}

        {/* 2. Center Product Stage */}
        <Animated.View style={[styles.productStage, animatedProductFloat]}>
          {/* Product 1: Splash_Pill */}
          <Animated.Image
            source={PRODUCT_IMAGES[0]}
            style={[styles.productImage, animatedPillStyle]}
            resizeMode="contain"
          />

          {/* Product 2: Splash_Bottle */}
          <Animated.Image
            source={PRODUCT_IMAGES[1]}
            style={[styles.productImage, styles.productImageOverlap, animatedBottleStyle]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 3. Orbit Arc Layer (Front half - in front of product) */}
        {renderOrbitHalf(true)}
      </View>

      {/* Copy / Message */}
      <View style={styles.copyContainer}>
        <Text style={[styles.title, { color: colors.textPrimary || '#1E293B' }]}>
          {t('auth.restoringMessage', 'Getting Sneheal ready...')}
        </Text>

        {/* 4-Segmented Progress Indicator */}
        <SegmentedProgressBar activeIndex={activeStep} />
      </View>

      {/* 5. Bottom Screen Organic Fluid Wave Pattern */}
      <BottomWaves />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  // Bottom Screen Fluid Waves
  bottomWavesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 95,
    zIndex: 0,
  },

  // Top Center Background Mandala
  topMandalaWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  topMandala: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    marginTop: -MANDALA_SIZE * 0.46,
    opacity: 0.95,
  },

  // Fairy Lights Garland
  garlandWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: GARLAND_HEIGHT,
    zIndex: 1,
  },
  garlandImage: {
    width: SCREEN_WIDTH,
    height: GARLAND_HEIGHT,
  },

  // Hanging Lanterns (Equidistant from left and right edges for exact center symmetry)
  leftLanternWrapper: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: LANTERN_WIDTH,
    height: LANTERN_HEIGHT,
    zIndex: 2,
    transformOrigin: 'top center',
  },
  rightLanternWrapper: {
    position: 'absolute',
    top: 0,
    right: 10,
    width: LANTERN_WIDTH,
    height: LANTERN_HEIGHT,
    zIndex: 2,
    transformOrigin: 'top center',
  },
  lanternImage: {
    width: LANTERN_WIDTH,
    height: LANTERN_HEIGHT,
  },

  stage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // 3D Orbit Layering Containers
  orbitPerspectiveContainer: {
    position: 'absolute',
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotateZ: '-22deg' }],
  },
  orbitClipWindow: {
    position: 'absolute',
    width: STAGE_SIZE,
    height: HALF_STAGE,
    overflow: 'hidden',
    alignItems: 'center',
  },
  orbitForeshortenLayer: {
    position: 'absolute',
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotateX: '66deg' }],
  },
  orbitSpinner: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Center Product Stage
  productStage: {
    zIndex: 10,
    width: PRODUCT_SIZE,
    height: PRODUCT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: PRODUCT_SIZE,
    height: PRODUCT_SIZE,
  },
  productImageOverlap: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Copy & Progress
  copyContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  segmentPill: {
    width: 26,
    height: 7,
    borderRadius: 4,
  },
  segmentPillActive: {
    backgroundColor: '#FF1F6D',
  },
  segmentPillInactive: {
    backgroundColor: '#FCE7F3',
  },
});

export default SessionRestoreVisual;
