import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTabBarVisibility } from '@/context/TabBarVisibilityContext';

const AnimatedTabBar = (props: BottomTabBarProps) => {
  const { tabBarOffset } = useTabBarVisibility();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarOffset.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
});

export default AnimatedTabBar;
