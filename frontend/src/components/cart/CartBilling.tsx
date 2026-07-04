import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import BillTicketEdge from './BillTicketEdge';
import DecorativeBubbles from './DecorativeBubbles';

const { colors, spacing, typography, borderRadius, moderateScale } = theme;

const PAGE_BG = '#F5F6F8';
const SAVINGS_GREEN = '#0C831F';
const SAVINGS_GREEN_DARK = '#0A6B1A';

export interface BillLine {
  label: string;
  value: string;
  strikethrough?: string;
  highlight?: boolean;
  free?: boolean;
}

interface CartBillingProps {
  lines: BillLine[];
  savings: number;
  grandTotal: number;
  currency?: string;
}

const CartBilling = ({
  lines,
  savings,
  grandTotal,
  currency = '₹',
}: CartBillingProps) => (
  <View style={styles.wrap}>
    <BillTicketEdge pageColor={PAGE_BG} cardColor={colors.white} />

    <View style={styles.card}>
      <Text style={styles.title}>Bill details</Text>

      {lines.map((line) => (
        <View key={line.label} style={styles.row}>
          <Text style={styles.label}>{line.label}</Text>
          <View style={styles.valueGroup}>
            {line.strikethrough ? (
              <Text style={styles.strike}>{line.strikethrough}</Text>
            ) : null}
            <Text
              style={[
                styles.value,
                line.free && styles.freeText,
                line.highlight && styles.highlightText,
              ]}
            >
              {line.value}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.dashedRule} />

      {savings > 0 ? (
        <LinearGradient
          colors={[SAVINGS_GREEN, SAVINGS_GREEN_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.savingsBanner}
        >
          <DecorativeBubbles />
          <View style={styles.savingsContent}>
            <View style={styles.savingsLeft}>
              <View style={styles.savingsIconWrap}>
                <Ionicons name="pricetag" size={14} color={SAVINGS_GREEN} />
              </View>
              <Text style={styles.savingsText}>
                Your total savings on this order
              </Text>
            </View>
            <Text style={styles.savingsAmount}>
              {currency}{savings.toFixed(2)}
            </Text>
          </View>
        </LinearGradient>
      ) : null}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>To pay</Text>
        <Text style={styles.totalValue}>
          {currency}{grandTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
  },
  card: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm + 2,
  },
  title: {
    fontSize: moderateScale(15, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  strike: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  value: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  freeText: {
    color: SAVINGS_GREEN,
    fontWeight: '700',
  },
  highlightText: {
    color: SAVINGS_GREEN,
  },
  dashedRule: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  savingsBanner: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minHeight: moderateScale(44, 0.35),
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    zIndex: 1,
  },
  savingsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  savingsIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  savingsText: {
    flex: 1,
    fontSize: moderateScale(12, 0.35),
    fontWeight: '600',
    color: colors.white,
    lineHeight: 17,
  },
  savingsAmount: {
    fontSize: moderateScale(14, 0.35),
    fontWeight: '800',
    color: colors.white,
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: moderateScale(18, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default CartBilling;
