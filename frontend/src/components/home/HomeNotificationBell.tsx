import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import RunningBorderHighlight from '@/components/common/RunningBorderHighlight';
import theme from '@/styles/theme';

const { colors, moderateScale } = theme;

const BTN_SIZE = moderateScale(42);
const BTN_RADIUS = moderateScale(12);
const BORDER_LOOP_MS = 2800;

interface HomeNotificationBellProps {
  onPress?: () => void;
  hasUnread?: boolean;
  ringActive?: boolean;
  accessibilityLabel: string;
}

const HomeNotificationBell: React.FC<HomeNotificationBellProps> = ({
  onPress,
  hasUnread = false,
  ringActive = false,
  accessibilityLabel,
}) => {
  const swing = useSharedValue(0);
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (!ringActive) {
      cancelAnimation(swing);
      cancelAnimation(bounce);
      swing.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
      bounce.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
      return;
    }

    swing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.sin) }),
        withTiming(-1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.55, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) }),
        withDelay(880, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    bounce.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 200, easing: Easing.out(Easing.back(1.6)) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
        withDelay(960, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(swing);
      cancelAnimation(bounce);
    };
  }, [ringActive, bounce, swing]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${swing.value * 14}deg` },
      { scale: bounce.value },
      { translateY: -swing.value * 1.2 },
    ],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          position: 'relative',
          width: BTN_SIZE,
          height: BTN_SIZE,
        },
        btn: {
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: BTN_RADIUS,
          backgroundColor: colors.headerGlass,
          borderWidth: 1,
          borderColor: colors.headerGlassBorder,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        btnHighlight: {
          borderColor: 'rgba(255, 224, 138, 0.65)',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
        },
        notifDot: {
          position: 'absolute',
          top: 9,
          right: 9,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.error,
          borderWidth: 1.5,
          borderColor: colors.white,
          zIndex: 2,
        },
      }),
    [],
  );

  return (
    <View style={styles.shell}>
      <TouchableOpacity
        style={[styles.btn, ringActive && styles.btnHighlight]}
        activeOpacity={0.8}
        onPress={onPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Animated.View style={bellStyle}>
          <Ionicons
            name={ringActive ? 'notifications' : 'notifications-outline'}
            size={moderateScale(20)}
            color={ringActive ? colors.primary : colors.headerTextDark}
          />
        </Animated.View>
        {hasUnread ? <View style={styles.notifDot} /> : null}
      </TouchableOpacity>
      {ringActive ? (
        <RunningBorderHighlight
          borderRadius={BTN_RADIUS}
          loopMs={BORDER_LOOP_MS}
          stroke={2.5}
        />
      ) : null}
    </View>
  );
};

export default React.memo(HomeNotificationBell);
