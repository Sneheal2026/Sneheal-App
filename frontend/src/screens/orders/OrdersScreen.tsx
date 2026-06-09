import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography, borderRadius } = theme;

const OrdersScreen = () => {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track and manage your deliveries</Text>
      </View>

      {/* Empty State */}
      <View style={styles.emptyState}>
        <View style={styles.iconBubble}>
          <Ionicons name="receipt-outline" size={56} color={colors.secondary} />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Once you place your first order,{'\n'}
          you can track it right here.
        </Text>
      </View>

      {/* Info Pills */}
      <View style={styles.infoRow}>
        {[
          { icon: 'cube-outline', label: 'Packed Fresh', color: colors.success },
          { icon: 'bicycle-outline', label: 'Fast Delivery', color: colors.primary },
          { icon: 'card-outline', label: 'Easy Payments', color: colors.secondary },
        ].map((item) => (
          <View key={item.label} style={[styles.pill, { borderColor: item.color + '40' }]}>
            <Ionicons name={item.icon as any} size={16} color={item.color} />
            <Text style={[styles.pillText, { color: item.color }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Decorative order status legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Order Status Guide</Text>
        {[
          { icon: 'time-outline', label: 'Pending', desc: 'Order received', color: colors.warning },
          { icon: 'cube-outline', label: 'Packed', desc: 'Being prepared', color: colors.info },
          { icon: 'bicycle-outline', label: 'On the way', desc: 'Out for delivery', color: colors.primary },
          { icon: 'checkmark-circle-outline', label: 'Delivered', desc: 'At your door', color: colors.success },
        ].map((status) => (
          <View key={status.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: status.color }]}>
              <Ionicons name={status.icon as any} size={12} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.legendLabel}>{status.label}</Text>
              <Text style={styles.legendDesc}>{status.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxxl,
  },
  iconBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  pillText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  legendCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  legendTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  legendDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

export default OrdersScreen;
