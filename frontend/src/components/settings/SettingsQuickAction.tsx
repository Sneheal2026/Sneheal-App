import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SettingsQuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

const SettingsQuickAction: React.FC<SettingsQuickActionProps> = ({
  icon,
  label,
  onPress,
}) => {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.sm,
          gap: spacing.sm,
        },
        shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.infoLight }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.label, typography.caption, { color: colors.textPrimary }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default React.memo(SettingsQuickAction);
