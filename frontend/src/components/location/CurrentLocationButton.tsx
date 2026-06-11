import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, typography, shadows, moderateScale } = theme;

interface CurrentLocationButtonProps {
  onPress: () => void;
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Center map on current location"
      accessibilityRole="button"
    >
      <Ionicons name="locate" size={20} color={colors.primary} />
      <Text style={styles.text}>Current location</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.md,
  },
  text: {
    ...typography.body,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default CurrentLocationButton;
