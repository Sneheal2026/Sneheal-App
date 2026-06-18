import React from 'react';
import { StyleSheet, TouchableOpacity, View, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import PrescriptionScanIcon from './PrescriptionScanIcon';
import theme from '@/styles/theme';

const { colors, shadows } = theme;

const SCAN_BUTTON_SIZE = 66;
const SCAN_ICON_SIZE = 50;
const RING_WIDTH = 4;

const ScanTabButton = ({ onPress, accessibilityState, style }: BottomTabBarButtonProps) => {
  const handlePress = (event: GestureResponderEvent) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="Scan prescription"
      style={[styles.touchTarget, style]}
    >
      <View style={styles.halo}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.primaryLight, colors.primary]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.ring}
        >
          <View style={styles.button}>
            <PrescriptionScanIcon size={SCAN_ICON_SIZE} />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: -30,
  },
  halo: {
    borderRadius: SCAN_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(168, 168, 168, 0.14)',
    padding: 3,
   
  },
  ring: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    padding: RING_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    width: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});

export default ScanTabButton;
