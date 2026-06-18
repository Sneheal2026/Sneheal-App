import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PrescriptionScanIconProps {
  size?: number;
}

const VIEWBOX = 80;
const FRAME_TOP = 22;
const FRAME_HEIGHT = 36;
const FRAME_LEFT = 10;
const FRAME_WIDTH = 60;
const BEAM_HEIGHT = 10;
const SCAN_SWEEP_MS = 2400;
const SCAN_HOLD_MS = 200;

const PrescriptionScanIcon = ({ size = 56 }: PrescriptionScanIconProps) => {
  const progress = useSharedValue(0);

  const layout = useMemo(() => {
    const unit = size / VIEWBOX;
    const frameHeight = FRAME_HEIGHT * unit;
    const beamHeight = BEAM_HEIGHT * unit;
    return {
      unit,
      frameLeft: FRAME_LEFT * unit,
      frameTop: FRAME_TOP * unit,
      frameWidth: FRAME_WIDTH * unit,
      frameHeight,
      beamHeight,
      scanStart: 0,
      scanTravel: frameHeight - beamHeight,
    };
  }, [size]);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SCAN_SWEEP_MS, easing: Easing.linear }),
        withDelay(SCAN_HOLD_MS, withTiming(1, { duration: 0 })),
        withTiming(0, { duration: SCAN_SWEEP_MS, easing: Easing.linear }),
        withDelay(SCAN_HOLD_MS, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [progress]);

  const {
    scanStart,
    scanTravel,
    beamHeight,
    unit,
    frameLeft,
    frameTop,
    frameWidth,
    frameHeight,
  } = layout;

  const beamStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: scanStart + progress.value * scanTravel,
      },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} fill="none">
        <Defs>
          <SvgLinearGradient id="bracketGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1558B0" />
            <Stop offset="1" stopColor="#00D4FF" />
          </SvgLinearGradient>
          <SvgLinearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E8F4FF" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </SvgLinearGradient>
        </Defs>

        <Path
          d="M14 22 V14 H22"
          stroke="url(#bracketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M66 22 V14 H58"
          stroke="url(#bracketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M14 58 V66 H22"
          stroke="url(#bracketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M66 58 V66 H58"
          stroke="url(#bracketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Circle cx="36" cy="12" r="2.2" fill="#4A9CF5" />
        <Circle cx="40" cy="12" r="2.2" fill="#1A73E8" />
        <Circle cx="44" cy="12" r="2.2" fill="#00B8E6" />

        <Rect x="27" y="24" width="26" height="34" rx="4" fill="#1A73E8" opacity={0.12} />

        <Rect
          x="26"
          y="22"
          width="26"
          height="34"
          rx="4"
          fill="url(#docGrad)"
          stroke="#B8D9F5"
          strokeWidth="0.8"
        />

        <Path d="M46 22 H52 V28 L46 22 Z" fill="#4A9CF5" />
        <Path d="M46 22 L52 28" stroke="#1A73E8" strokeWidth="0.6" />

        <Rect x="30" y="28" width="14" height="2.4" rx="1.2" fill="#4A9CF5" opacity={0.85} />
        <Rect x="30" y="33" width="18" height="2.4" rx="1.2" fill="#1A73E8" opacity={0.9} />
        <Rect x="30" y="38" width="12" height="2.4" rx="1.2" fill="#4A9CF5" opacity={0.8} />
        <Circle cx="30.8" cy="44.2" r="1.2" fill="#1A73E8" />
        <Rect x="33.5" y="43" width="10" height="2.4" rx="1.2" fill="#4A9CF5" opacity={0.75} />

        <Path
          d="M30 50 C32 48.5, 34 52, 36 50 C38 48, 40 51.5, 42 49.5 C44 48, 46 50, 48 49"
          stroke="#1558B0"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View
        pointerEvents="none"
        style={[
          styles.scanFrame,
          {
            left: frameLeft,
            top: frameTop,
            width: frameWidth,
            height: frameHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.beam,
            { height: beamHeight },
            beamStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(0,242,255,0)',
              'rgba(0,232,255,0.22)',
              'rgba(0,242,255,0.16)',
              'rgba(0,232,255,0.22)',
              'rgba(0,242,255,0)',
            ]}
            style={[styles.beamLayer, { height: beamHeight * 0.75, top: 0 }]}
          />
          <View
            style={[
              styles.glowBand,
              { height: beamHeight * 0.65, top: beamHeight * 0.1 },
            ]}
          />
          <LinearGradient
            colors={[
              'rgba(0,160,255,0)',
              'rgba(0,210,255,0.75)',
              'rgba(0,230,255,0.9)',
              'rgba(0,210,255,0.75)',
              'rgba(0,160,255,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.coreLine,
              { height: unit * 3.2, top: beamHeight * 0.34 },
            ]}
          />
          <View
            style={[
              styles.brightCore,
              {
                height: unit * 1.3,
                top: beamHeight * 0.42,
              },
            ]}
          />
          <View
            style={[
              styles.trailBelow,
              { height: beamHeight * 0.4, top: beamHeight * 0.58 },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scanFrame: {
    position: 'absolute',
    overflow: 'hidden',
  },
  beam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    shadowColor: '#00F2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  beamLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  glowBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 225, 236, 0.15)',
    borderRadius: 999,
  },
  coreLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 999,
  },
  brightCore: {
    position: 'absolute',
    left: '2%',
    right: '2%',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
  },
  trailBelow: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderRadius: 999,
  },
});

export default PrescriptionScanIcon;
