import React, { useEffect, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const DEFAULT_STROKE = 3;
const DEFAULT_FLASH_LEN = 96;
const DEFAULT_TAIL_LEN = 40;
const DEFAULT_LOOP_MS = 4000;
const RUN_PORTION = 0.32;

const roundedPerimeter = (width: number, height: number, radius: number) => {
  const rx = Math.min(radius, width / 2, height / 2);
  return 2 * (width + height - 2 * rx) + 2 * Math.PI * rx;
};

export interface RunningBorderHighlightProps {
  borderRadius: number;
  stroke?: number;
  loopMs?: number;
}

/** Gold comet + cyan tail that runs the rounded outline (cart bar style). */
const RunningBorderHighlight: React.FC<RunningBorderHighlightProps> = ({
  borderRadius,
  stroke = DEFAULT_STROKE,
  loopMs = DEFAULT_LOOP_MS,
}) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const progress = useSharedValue(0);
  const perimeter = useSharedValue(1);
  const flashRx = Math.max(0, borderRadius - stroke / 2);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  useEffect(() => {
    if (size.w < 8 || size.h < 8) return;

    const innerW = size.w - stroke;
    const innerH = size.h - stroke;
    perimeter.value = roundedPerimeter(innerW, innerH, flashRx);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: loopMs, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [size.w, size.h, flashRx, loopMs, perimeter, progress, stroke]);

  const flashStyle = useAnimatedStyle(() => {
    const t = progress.value;
    if (t >= RUN_PORTION) return { opacity: 0 };
    const fadeStart = RUN_PORTION * 0.8;
    const opacity = t < fadeStart ? 1 : 1 - (t - fadeStart) / (RUN_PORTION - fadeStart);
    return { opacity };
  });

  const headProps = useAnimatedProps(() => ({
    strokeDashoffset: -perimeter.value * Math.min(progress.value / RUN_PORTION, 1),
  }));

  const tailProps = useAnimatedProps(() => ({
    strokeDashoffset:
      -perimeter.value * Math.min(progress.value / RUN_PORTION, 1) + 36,
  }));

  const innerW = Math.max(0, size.w - stroke);
  const innerH = Math.max(0, size.h - stroke);
  const dashGap = Math.max(roundedPerimeter(innerW, innerH, flashRx), DEFAULT_FLASH_LEN);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.w > 0 ? (
        <>
          <Svg width={size.w} height={size.h}>
            <Rect
              x={stroke / 2}
              y={stroke / 2}
              width={innerW}
              height={innerH}
              rx={flashRx}
              ry={flashRx}
              fill="none"
              stroke="rgba(255, 224, 138, 0.35)"
              strokeWidth={1.5}
            />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, flashStyle]}>
            <Svg width={size.w} height={size.h}>
              <AnimatedRect
                x={stroke / 2}
                y={stroke / 2}
                width={innerW}
                height={innerH}
                rx={flashRx}
                ry={flashRx}
                fill="none"
                stroke="#7EE8F0"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={`${DEFAULT_TAIL_LEN} ${dashGap}`}
                animatedProps={tailProps}
              />
              <AnimatedRect
                x={stroke / 2}
                y={stroke / 2}
                width={innerW}
                height={innerH}
                rx={flashRx}
                ry={flashRx}
                fill="none"
                stroke="#FFE08A"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${DEFAULT_FLASH_LEN} ${dashGap}`}
                animatedProps={headProps}
              />
            </Svg>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
};

export default RunningBorderHighlight;
