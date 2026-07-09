import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import ScanIcon from './ScanIcon';
import ScanTabGlow from './ScanTabGlow';
import type { AuthStackParamList } from '@/navigation/types';
import { SCAN_BUTTON_SIZE, SCAN_ICON_SIZE } from '@/navigation/tabBarConfig';
import { useTheme } from '@/hooks/useTheme';

const ScanTabButton = ({ style, accessibilityState }: BottomTabBarButtonProps) => {
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();

  const handlePress = () => {
    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    parent?.navigate('MedicineScan');
  };

  return (
    <View style={[styles.wrapper, style]} pointerEvents="box-none">
      <View style={styles.buttonSlot}>
        <ScanTabGlow />
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityState={accessibilityState}
          accessibilityLabel="Scan prescription"
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
            shadows.md,
            pressed && styles.buttonPressed,
          ]}
        >
          <ScanIcon size={SCAN_ICON_SIZE} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  buttonSlot: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  button: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});

export default ScanTabButton;
