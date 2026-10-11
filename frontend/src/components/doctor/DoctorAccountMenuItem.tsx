import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

type IoniconName = keyof typeof Ionicons.glyphMap;

export type DoctorAccountMenuItemProps = {
  icon: IoniconName;
  label: string;
  active?: boolean;
  destructive?: boolean;
  onPress: () => void;
};

const DoctorAccountMenuItem: React.FC<DoctorAccountMenuItemProps> = ({
  icon,
  label,
  active = false,
  destructive = false,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.row,
      active && styles.rowActive,
      pressed && styles.rowPressed,
    ]}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    accessibilityLabel={label}
  >
    <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? '#DC2626' : doctorTheme.textPrimary}
      />
    </View>
    <Text
      style={[styles.label, destructive && styles.labelDestructive]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  rowActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  rowPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {},
  label: {
    ...typography.body,
    flex: 1,
    fontWeight: '500',
    color: doctorTheme.textPrimary,
    letterSpacing: -0.2,
  },
  labelDestructive: {
    color: '#DC2626',
    fontWeight: '600',
  },
});

export default React.memo(DoctorAccountMenuItem);
