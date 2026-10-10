import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

type ChartSectionProps = {
  title: string;
  hint?: string;
  empty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
};

const ChartSection = ({ title, hint, empty, emptyLabel, children }: ChartSectionProps) => (
  <View style={styles.section}>
    <Text style={[styles.title, !hint && styles.titleGap]}>{title}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    {empty ? (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    ) : (
      children
    )}
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h4,
    fontSize: 16,
    color: doctorTheme.textPrimary,
    fontWeight: '700',
  },
  titleGap: {
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  empty: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
  },
});

export default ChartSection;
