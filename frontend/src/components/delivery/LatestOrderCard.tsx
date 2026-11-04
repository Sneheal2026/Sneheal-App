import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';
import type { DeliveryQueueOrder } from '@/types/order.types';
import { formatInr } from '@/utils/cartBilling';
import { formatDeliveryAddress } from '@/utils/openGoogleMapsNavigation';

const { spacing, typography, borderRadius, shadows } = theme;

interface LatestOrderCardProps {
  order: DeliveryQueueOrder;
  onPress: () => void;
}

const LatestOrderCard: React.FC<LatestOrderCardProps> = ({ order, onPress }) => {
  const { t } = useTranslation();

  const address = useMemo(
    () =>
      formatDeliveryAddress({
        flatNumber: order.flatNumber,
        addressLine: order.addressLine,
        landmark: order.landmark,
      }),
    [order.addressLine, order.flatNumber, order.landmark],
  );

  const statusKey =
    order.status === 'out_for_delivery'
      ? 'delivery.inTransit'
      : order.status === 'delivered'
        ? 'delivery.delivered'
        : 'delivery.readyForPickup';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('delivery.latestOrders.openA11y', { publicId: order.publicId })}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.publicId}>{order.publicId}</Text>
          <Text style={styles.cod}>{t('cart.codTitle')}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.total}>{formatInr(order.grandTotal)}</Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>{t(statusKey)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.customerBlock}>
        <Text style={styles.customerName}>{order.receiverName}</Text>
        <Text style={styles.mobile}>{order.mobile}</Text>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={16} color={deliveryTheme.accent} />
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
      </View>

      <View style={styles.itemsBlock}>
        <Text style={styles.itemsHeading}>{t('delivery.latestOrders.itemsHeading')}</Text>
        {(order.items ?? []).slice(0, 4).map((line, index) => (
          <Text key={`${line.name}-${index}`} style={styles.itemLine} numberOfLines={1}>
            {t('delivery.latestOrders.itemLine', {
              qty: line.quantity,
              name: line.name,
              unit: line.unit,
              total: formatInr(line.lineTotal),
            })}
          </Text>
        ))}
        {(order.items ?? []).length > 4 ? (
          <Text style={styles.moreItems}>
            {t('delivery.latestOrders.moreItems', { count: (order.items ?? []).length - 4 })}
          </Text>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.tapHint}>{t('delivery.latestOrders.tapForDetails')}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: deliveryTheme.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    ...shadows.sm,
  },
  pressed: { opacity: 0.92 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  publicId: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: deliveryTheme.primary,
    letterSpacing: 0.3,
  },
  cod: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  total: {
    ...typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statusChip: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: deliveryTheme.accentMuted,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    color: deliveryTheme.accent,
  },
  customerBlock: {
    marginBottom: spacing.sm,
  },
  customerName: {
    ...typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  mobile: {
    ...typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.background,
    marginBottom: spacing.md,
  },
  address: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
    color: theme.colors.textPrimary,
  },
  itemsBlock: {
    gap: 4,
    marginBottom: spacing.md,
  },
  itemsHeading: {
    ...typography.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  itemLine: {
    ...typography.bodySmall,
    color: theme.colors.textPrimary,
  },
  moreItems: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: deliveryTheme.border,
    paddingTop: spacing.sm,
  },
  tapHint: {
    ...typography.caption,
    fontWeight: '600',
    color: deliveryTheme.accent,
  },
});

export default LatestOrderCard;
