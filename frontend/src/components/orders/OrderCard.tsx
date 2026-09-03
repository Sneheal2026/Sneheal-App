import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatInr } from '@/utils/cartBilling';
import { ORDER_STATUS_META } from '@/components/orders/orderStatusMeta';
import type { OrderListItem } from '@/types/order.types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

type Props = {
  order: OrderListItem;
  onPress: (orderId: string) => void;
};

const formatOrderDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const OrderCard = ({ order, onPress }: Props) => {
  const { t } = useTranslation();
  const meta = ORDER_STATUS_META[order.status];
  const itemLabel =
    order.itemCount > 1
      ? `${order.firstItemName ?? t('orders.itemFallback')} + ${order.itemCount - 1}`
      : order.firstItemName ?? t('orders.itemFallback');

  return (
    <Pressable
      onPress={() => onPress(order.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${order.publicId}, ${t(`orders.status.${order.status}`)}, ${formatInr(order.grandTotal)}`}
    >
      <View style={styles.main}>
        <View style={styles.topRow}>
          <Text style={styles.publicId}>{order.publicId}</Text>
          <View style={[styles.chip, { backgroundColor: meta.chipBg }]}>
            <Text style={[styles.chipText, { color: meta.chipText }]}>
              {t(`orders.status.${order.status}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>
          {itemLabel}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.meta}>
            {formatOrderDate(order.createdAt)} · {t('cart.itemCount', { count: order.itemCount })}
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.total}>{formatInr(order.grandTotal)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.94,
  },
  main: {
    padding: spacing.md,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  publicId: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  itemName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  total: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default memo(OrderCard);
