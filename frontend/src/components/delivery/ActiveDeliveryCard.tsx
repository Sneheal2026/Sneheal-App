import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';
import type { DeliveryOrder, DeliveryStatus } from './types';

const { spacing, typography, borderRadius, shadows } = theme;

interface ActiveDeliveryCardProps {
  order: DeliveryOrder;
  onNavigate?: () => void;
  onCall?: () => void;
}

const STATUS_STYLES: Record<
  DeliveryStatus,
  { accent: string; bg: string; label: string }
> = {
  ready: {
    accent: deliveryTheme.ready,
    bg: deliveryTheme.readyBg,
    label: 'Ready for pickup',
  },
  transit: {
    accent: deliveryTheme.transit,
    bg: deliveryTheme.transitBg,
    label: 'In transit',
  },
  delivered: {
    accent: deliveryTheme.online,
    bg: deliveryTheme.onlineBg,
    label: 'Delivered',
  },
};

const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  order,
  onNavigate,
  onCall,
}) => {
  const statusStyle = STATUS_STYLES[order.status];

  return (
    <View style={[styles.card, { borderLeftColor: statusStyle.accent }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.eta}>ETA {order.eta}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.accent }]}>
            {order.statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{order.customer.charAt(0)}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer}</Text>
          <Text style={styles.meta}>
            {order.items} {order.items === 1 ? 'item' : 'items'} · {order.distance}
          </Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={18} color={deliveryTheme.accent} />
        <Text style={styles.address} numberOfLines={2}>
          {order.address}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onCall}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${order.customer}`}
        >
          <Ionicons name="call-outline" size={18} color={theme.colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>Call</Text>
        </Pressable>

        <Pressable
          onPress={onNavigate}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Navigate to ${order.orderId}`}
        >
          <Ionicons name="navigate-outline" size={18} color={theme.colors.textInverse} />
          <Text style={styles.primaryBtnText}>Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: deliveryTheme.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderId: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  eta: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.body,
    fontWeight: '700',
    color: deliveryTheme.accent,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.background,
  },
  address: {
    ...typography.bodySmall,
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    backgroundColor: deliveryTheme.surface,
  },
  secondaryBtnText: {
    ...typography.button,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  primaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.accent,
  },
  primaryBtnText: {
    ...typography.button,
    fontSize: 14,
    color: theme.colors.textInverse,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default ActiveDeliveryCard;
