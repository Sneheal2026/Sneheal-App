import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import RunningBorderHighlight from '@/components/common/RunningBorderHighlight';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, moderateScale } = theme;

const BUBBLE_RADIUS = borderRadius.lg;
const CALLOUT_BORDER_LOOP_MS = 3200;
const ARROW_TIP = '#1A1468';
const GRADIENT_COLORS = ['#0E0A3A', '#1A1468', '#243B8C'] as const;

interface HomeAppUpdateCalloutProps {
  visible: boolean;
  message: string;
}

const HomeAppUpdateCallout: React.FC<HomeAppUpdateCalloutProps> = ({ visible, message }) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          top: moderateScale(44),
          right: 0,
          maxWidth: moderateScale(300),
          minWidth: moderateScale(232),
          zIndex: 20,
          alignItems: 'flex-end',
        },
        arrow: {
          width: 0,
          height: 0,
          borderLeftWidth: moderateScale(8),
          borderRightWidth: moderateScale(8),
          borderBottomWidth: moderateScale(8),
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: ARROW_TIP,
          marginBottom: -1,
          marginRight: moderateScale(15),
        },
        bubbleShell: {
          alignSelf: 'stretch',
          position: 'relative',
        },
        bubble: {
          borderRadius: BUBBLE_RADIUS,
          paddingHorizontal: spacing.md + 2,
          paddingVertical: spacing.sm + 4,
          overflow: 'hidden',
          shadowColor: '#1A1468',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          elevation: 8,
        },
        text: {
          color: colors.white,
          fontSize: moderateScale(13),
          fontWeight: '700',
          letterSpacing: 0.1,
          textAlign: 'center',
        },
      }),
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(160).duration(300).springify().damping(18)}
      exiting={FadeOutUp.duration(260)}
      style={styles.wrap}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <View style={styles.arrow} />
      <View style={styles.bubbleShell}>
        <View style={styles.bubble}>
          <LinearGradient
            colors={[...GRADIENT_COLORS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={styles.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {message}
          </Text>
        </View>
        <RunningBorderHighlight
          borderRadius={BUBBLE_RADIUS}
          loopMs={CALLOUT_BORDER_LOOP_MS}
          stroke={2.5}
        />
      </View>
    </Animated.View>
  );
};

export default React.memo(HomeAppUpdateCallout);
