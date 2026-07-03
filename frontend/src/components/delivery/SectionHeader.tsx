import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '@/styles/theme';

const { spacing, typography } = theme;

interface SectionHeaderProps {
  title: string;
  count?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {typeof count === 'number' ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default SectionHeader;
