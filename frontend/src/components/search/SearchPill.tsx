import React, { useMemo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SearchPillProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders a filled, accented pill — used for trending terms. */
  accented?: boolean;
}

const SearchPill: React.FC<SearchPillProps> = ({ label, onPress, icon, accented = false }) => {
  const { colors, spacing, typography, borderRadius, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: accented ? colors.primaryBorder : colors.border,
          backgroundColor: accented ? colors.primarySurface : colors.surface,
        },
        pressed: {
          opacity: 0.7,
        },
        label: {
          ...typography.caption,
          fontWeight: '600',
          color: accented ? colors.primary : colors.textPrimary,
        },
      }),
    [accented, borderRadius, colors, spacing, typography],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={moderateScale(13)}
          color={accented ? colors.primary : colors.textMuted}
        />
      ) : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

export default SearchPill;
