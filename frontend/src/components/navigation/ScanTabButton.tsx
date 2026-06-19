import React from 'react';
import { StyleSheet, TouchableOpacity, View, type GestureResponderEvent } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import ScanIcon from './ScanIcon';
import theme from '@/styles/theme';

const { colors, spacing } = theme;

const SCAN_BUTTON_SIZE = 58;
const SCAN_ICON_SIZE = 43;

const ScanTabButton = ({ onPress, accessibilityState, style }: BottomTabBarButtonProps) => {
  const handlePress = (event: GestureResponderEvent) => {
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="Scan prescription"
      style={[styles.wrapper, style]}
    >
      <View style={styles.button}>
        <ScanIcon size={SCAN_ICON_SIZE} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    top: -10,
  },
  button: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});

export default ScanTabButton;
