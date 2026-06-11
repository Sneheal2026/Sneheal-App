import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors } = theme;

const PIN_SIZE = 36;

/**
 * Fixed center pin — tip sits exactly on the map center (50%, 50%).
 * User pans the map underneath (Swiggy-style).
 */
const CenterMapPin: React.FC = () => (
  <View style={styles.container} pointerEvents="none">
    <Ionicons name="location-sharp" size={PIN_SIZE} color={colors.error} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -PIN_SIZE / 2 }, { translateY: -PIN_SIZE }],
    zIndex: 100,
  },
});

export default CenterMapPin;
