import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

export type MedicineOrderCardProps = {
  publicId: string;
  dateLabel: string;
  statusLabel: string;
  tone: 'done' | 'active' | 'muted';
  lines: { name: string; quantity: number }[];
};

const toneColor = (tone: MedicineOrderCardProps['tone']) => {
  if (tone === 'done') return doctorTheme.orderDelivered;
  if (tone === 'active') return doctorTheme.primary;
  return doctorTheme.orderCancelled;
};

const MedicineOrderCard = ({
  publicId,
  dateLabel,
  statusLabel,
  tone,
  lines,
}: MedicineOrderCardProps) => {
  const color = toneColor(tone);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.ids}>
          <Text style={styles.orderId}>{publicId}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
          <Text style={[styles.status, { color }]}>{statusLabel}</Text>
        </View>
      </View>
      {lines.length === 0 ? (
        <Text style={styles.emptyLine}>No items recorded</Text>
      ) : (
        lines.map((line, index) => (
          <Text key={`${publicId}-${index}`} style={styles.line}>
            {line.name}
            <Text style={styles.qty}> × {line.quantity}</Text>
          </Text>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ids: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  date: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 2,
  },
  pill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  status: {
    ...typography.caption,
    fontWeight: '700',
  },
  line: {
    ...typography.body,
    fontSize: 14,
    color: doctorTheme.textPrimary,
    marginTop: 2,
  },
  qty: {
    color: doctorTheme.textSecondary,
    fontWeight: '600',
  },
  emptyLine: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
  },
});

export default MedicineOrderCard;
