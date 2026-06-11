import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;

interface SettingsListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
  destructive?: boolean;
  trailing?: React.ReactNode;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({
  icon,
  label,
  onPress,
  showDivider = true,
  destructive = false,
  trailing,
}) => (
  <>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.error : colors.textPrimary}
        />
      </View>
      <Text
        style={[styles.label, destructive && styles.labelDestructive]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
    {showDivider ? <View style={styles.divider} /> : null}
  </>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: colors.errorLight,
  },
  label: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  labelDestructive: {
    color: colors.error,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});

export default React.memo(SettingsListItem);
