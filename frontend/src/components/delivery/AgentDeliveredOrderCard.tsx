import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';
import type { DeliveryQueueOrder } from '@/types/order.types';
import { formatInr } from '@/utils/cartBilling';

const { spacing, typography, borderRadius, shadows } = theme;

interface AgentDeliveredOrderCardProps {
  order: DeliveryQueueOrder;
  onPress: () => void;
}

const formatDeliveredWhen = (iso: string | null | undefined, locale: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AgentDeliveredOrderCard: React.FC<AgentDeliveredOrderCardProps> = ({ order, onPress }) => {
  const { t, i18n } = useTranslation();

  const deliveredLabel = useMemo(
    () => formatDeliveredWhen(order.deliveredAt, i18n.language),
    [i18n.language, order.deliveredAt],
  );

  const itemSummary = useMemo(() => {
    const lines = order.items ?? [];
    if (lines.length > 0) {
      const first = lines[0];
      if (lines.length === 1) {
        return `${first.quantity} × ${first.name}`;
      }
      return t('delivery.deliveredHistory.itemSummaryMore', {
        name: first.name,
        count: lines.length - 1,
      });
    }
    if (order.firstItemName) {
      return order.itemCount > 1
        ? t('delivery.deliveredHistory.itemSummaryMore', {
            name: order.firstItemName,
            count: order.itemCount - 1,
          })
        : order.firstItemName;
    }
    return t('delivery.deliveredHistory.itemsFallback', { count: order.itemCount });
  }, [order.firstItemName, order.itemCount, order.items, t]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('delivery.deliveredHistory.openA11y', { publicId: order.publicId })}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={22} color={deliveryTheme.online} />
        </View>
        <View style={styles.main}>
          <Text style={styles.publicId}>{order.publicId}</Text>
          <Text style={styles.customer}>{order.receiverName}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {itemSummary}
          </Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amount}>{formatInr(order.grandTotal)}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </View>
      </View>
      <View style={styles.footer}>
        <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
        <Text style={styles.deliveredAt}>
          {t('delivery.deliveredHistory.deliveredOn', { when: deliveredLabel })}
        </Text>
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
    borderLeftWidth: 4,
    borderLeftColor: deliveryTheme.online,
    ...shadows.sm,
  },
  pressed: { opacity: 0.92 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.onlineBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  publicId: {
    ...typography.caption,
    fontWeight: '800',
    color: deliveryTheme.primary,
    letterSpacing: 0.3,
  },
  customer: {
    ...typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  meta: {
    ...typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: deliveryTheme.border,
  },
  deliveredAt: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});

export default AgentDeliveredOrderCard;
