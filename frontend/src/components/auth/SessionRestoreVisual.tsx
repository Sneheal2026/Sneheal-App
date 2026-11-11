import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
 * Organic fluid wave corners (Top-Left and Bottom-Right)
 * Rendered using layered translucent pastel-pink gradients
 */
const CornerWaves = () => (
  <>
    {/* Top-Left Corner Waves */}
    <View pointerEvents="none" style={styles.cornerTopLeft}>
      <Svg width={230} height={230} viewBox="0 0 230 230">
        <Defs>
          <LinearGradient id="waveGrad1" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#F472B6" stopOpacity="0.38" />
            <Stop offset="50%" stopColor="#FBCFE8" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="waveGrad2" x1="0" y1="0" x2="170" y2="170" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FF1F6D" stopOpacity="0.20" />
            <Stop offset="60%" stopColor="#F472B6" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="waveGrad3" x1="0" y1="0" x2="230" y2="150" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.65" />
            <Stop offset="65%" stopColor="#FCE7F3" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer broad ambient curve */}
        <Path
          d="M 0 0 L 230 0 C 185 55, 135 95, 85 155 C 50 195, 22 218, 0 230 Z"
          fill="url(#waveGrad3)"
        />
        {/* Mid flowing silk curve */}
        <Path
          d="M 0 0 L 205 0 C 160 50, 110 90, 68 145 C 38 180, 15 200, 0 210 Z"
          fill="url(#waveGrad1)"
        />
        {/* Inner delicate wave crest */}
        <Path
          d="M 0 0 L 155 0 C 122 38, 78 70, 48 115 C 26 145, 10 162, 0 170 Z"
          fill="url(#waveGrad2)"
        />
      </Svg>
    </View>

    {/* Bottom-Right Corner Waves (Mirrored via 180° rotation) */}
    <View pointerEvents="none" style={styles.cornerBottomRight}>
      <View style={styles.rotate180}>
        <Svg width={230} height={230} viewBox="0 0 230 230">
          <Defs>
            <LinearGradient id="waveGradBR1" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#F472B6" stopOpacity="0.38" />
              <Stop offset="50%" stopColor="#FBCFE8" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="waveGradBR2" x1="0" y1="0" x2="170" y2="170" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#FF1F6D" stopOpacity="0.20" />
              <Stop offset="60%" stopColor="#F472B6" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="waveGradBR3" x1="0" y1="0" x2="230" y2="150" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.65" />
              <Stop offset="65%" stopColor="#FCE7F3" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Path
            d="M 0 0 L 230 0 C 185 55, 135 95, 85 155 C 50 195, 22 218, 0 230 Z"
            fill="url(#waveGradBR3)"
          />
          <Path
            d="M 0 0 L 205 0 C 160 50, 110 90, 68 145 C 38 180, 15 200, 0 210 Z"
            fill="url(#waveGradBR1)"
          />
          <Path
            d="M 0 0 L 155 0 C 122 38, 78 70, 48 115 C 26 145, 10 162, 0 170 Z"
            fill="url(#waveGradBR2)"
          />
        </Svg>
      </View>
    </View>
  </>
);

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

  // 1. Continuous 360° orbital revolution of the arcs
  const orbitRotation = useSharedValue(0);

  // 2. Gentle vertical bobbing / floating of the center product
  const floatVal = useSharedValue(0);

  // 3. Smooth cross-fade between Splash_Pill and Splash_Bottle
  const switchVal = useSharedValue(0);

  // 4. Segmented progress step (0 to 3)
  const [activeStep, setActiveStep] = React.useState(1);

  useEffect(() => {
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
      cancelAnimation(orbitRotation);
      cancelAnimation(floatVal);
      cancelAnimation(switchVal);
      clearInterval(progressTimer);
    };
  }, [orbitRotation, floatVal, switchVal]);

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
      {/* Background Corner Wave Designs (Top-Left & Bottom-Right) */}
      <CornerWaves />

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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },

  // Corner Wave Decorations
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 0,
  },
  rotate180: {
    transform: [{ rotate: '180deg' }],
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
