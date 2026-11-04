import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from '@/navigation/types';
import type { OrderDetail } from '@/types/order.types';
import {
  fetchOrderById,
  markOrderDeliveredByPublicId,
  invalidateOrdersCache,
  invalidateDeliveryQueueCache,
} from '@/services/orderService';
import { setOrderStatus } from '@/services/firebase';
import { ApiError } from '@/services/apiClient';
import { formatInr } from '@/utils/cartBilling';
import {
  formatDeliveryAddress,
  openGoogleMapsNavigation,
} from '@/utils/openGoogleMapsNavigation';
import { deliveryTheme } from '@/components/delivery/deliveryTheme';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'DeliveryOrderDetail'>;
type Route = RouteProp<AuthStackParamList, 'DeliveryOrderDetail'>;

const STATUS_CHIP: Record<OrderDetail['status'], { color: string; bg: string }> = {
  awaiting_payment: { color: '#B45309', bg: '#FEF3C7' },
  confirmed: { color: '#1D4ED8', bg: '#DBEAFE' },
  out_for_delivery: { color: '#6D28D9', bg: '#EDE9FE' },
  delivered: { color: '#047857', bg: '#D1FAE5' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6' },
};

const DeliveryOrderDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [marking, setMarking] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await fetchOrderById(orderId);
      setOrder(detail);
      setDelivered(detail.status === 'delivered');
    } catch (err) {
      setOrder(null);
      setLoadError(
        err instanceof ApiError ? err.message : t('delivery.orderDetail.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const addressText = useMemo(() => {
    if (!order) return '';
    return formatDeliveryAddress(order.address);
  }, [order]);

  const canMarkDelivered =
    order && order.status !== 'delivered' && order.status !== 'cancelled' && !delivered;

  const handleNavigate = useCallback(async () => {
    if (!order) return;
    setActionError(null);
    const ok = await openGoogleMapsNavigation({
      coords: order.coords,
      address: addressText,
    });
    if (!ok) {
      setActionError(t('delivery.orderDetail.mapsFailed'));
    }
  }, [addressText, order, t]);

  const handleCall = useCallback(() => {
    const mobile = order?.address.mobile?.trim();
    if (!mobile) return;
    void Linking.openURL(`tel:${mobile}`);
  }, [order?.address.mobile]);

  const handleConfirmDelivered = useCallback(async () => {
    if (!order || marking || !canMarkDelivered) return;
    setMarking(true);
    setActionError(null);
    try {
      const updated = await markOrderDeliveredByPublicId(order.publicId);
      setOrder(updated);
      setDelivered(true);
      setConfirmVisible(false);
      invalidateOrdersCache();
      invalidateDeliveryQueueCache();
      try {
        await setOrderStatus(updated.id, 'delivered', updated.publicId);
      } catch {
        // Non-fatal
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : t('delivery.markDeliveredFailed'),
      );
    } finally {
      setMarking(false);
    }
  }, [canMarkDelivered, marking, order, t]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('delivery.orderDetail.title')}</Text>
            {order ? (
              <Text style={styles.headerSubtitle}>{order.publicId}</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={deliveryTheme.accent} />
          <Text style={styles.loadingText}>{t('delivery.orderDetail.loading')}</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable
            onPress={() => void load()}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : order ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {delivered ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={24} color={deliveryTheme.online} />
                <View style={styles.flex}>
                  <Text style={styles.successTitle}>{t('deliveryConfirm.successTitle')}</Text>
                  <Text style={styles.successBody}>
                    {t('deliveryConfirm.successBody', { publicId: order.publicId })}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.label}>{t('orders.total')}</Text>
                <Text style={styles.grandTotal}>{formatInr(order.grandTotal)}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.label}>{t('orders.paymentMethod')}</Text>
                <Text style={styles.value}>{t('cart.codTitle')}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.label}>{t('orders.detailTitle')}</Text>
                <Text
                  style={[
                    styles.statusChip,
                    {
                      color: STATUS_CHIP[order.status].color,
                      backgroundColor: STATUS_CHIP[order.status].bg,
                    },
                  ]}
                >
                  {t(`orders.status.${order.status}`)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('deliveryConfirm.deliverTo')}</Text>
              <Text style={styles.customerName}>{order.address.receiverName}</Text>
              <Pressable onPress={handleCall} style={styles.phoneRow}>
                <Ionicons name="call-outline" size={16} color={deliveryTheme.accent} />
                <Text style={styles.phone}>{order.address.mobile}</Text>
              </Pressable>
              <View style={styles.addressBox}>
                <Ionicons name="location" size={18} color={deliveryTheme.accent} />
                <Text style={styles.address}>{addressText}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('delivery.latestOrders.itemsHeading')}</Text>
              {order.items.map((line) => (
                <View key={line.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>{line.name}</Text>
                    <Text style={styles.itemMeta}>
                      {line.quantity} × {line.unit}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatInr(line.lineTotal)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.label}>{t('orders.total')}</Text>
                <Text style={styles.grandTotal}>{formatInr(order.grandTotal)}</Text>
              </View>
            </View>

            {actionError ? <Text style={styles.inlineError}>{actionError}</Text> : null}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
            <View style={styles.footer}>
              <Pressable
                onPress={() => void handleNavigate()}
                style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.navBtnText}>{t('delivery.orderDetail.navigateCustomer')}</Text>
              </Pressable>

              {canMarkDelivered ? (
                <Pressable
                  onPress={() => setConfirmVisible(true)}
                  style={({ pressed }) => [styles.deliverBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="checkmark-done" size={20} color={deliveryTheme.primary} />
                  <Text style={styles.deliverBtnText}>{t('delivery.orderDetail.markDeliveredBtn')}</Text>
                </Pressable>
              ) : null}
            </View>
          </SafeAreaView>
        </>
      ) : null}

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !marking && setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="help-circle" size={40} color={deliveryTheme.accent} />
            </View>
            <Text style={styles.modalTitle}>{t('delivery.orderDetail.confirmTitle')}</Text>
            <Text style={styles.modalBody}>
              {t('delivery.orderDetail.confirmBody', { publicId: order?.publicId ?? '' })}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setConfirmVisible(false)}
                disabled={marking}
                style={({ pressed }) => [styles.modalSecondary, pressed && styles.pressed]}
              >
                <Text style={styles.modalSecondaryText}>{t('delivery.orderDetail.confirmNo')}</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleConfirmDelivered()}
                disabled={marking}
                style={({ pressed }) => [
                  styles.modalPrimary,
                  marking && styles.modalPrimaryDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {marking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalPrimaryText}>{t('delivery.orderDetail.confirmYes')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: deliveryTheme.background },
  flex: { flex: 1 },
  headerSafe: { backgroundColor: deliveryTheme.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '800',
  },
  headerSubtitle: {
    ...typography.caption,
    color: deliveryTheme.textMutedOnDark,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inlineError: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.primary,
  },
  retryBtnText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: deliveryTheme.onlineBg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: '#065F46',
  },
  successBody: {
    ...typography.caption,
    color: '#047857',
    marginTop: 2,
  },
  card: {
    backgroundColor: deliveryTheme.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  grandTotal: {
    ...typography.h4,
    fontWeight: '800',
    color: deliveryTheme.primary,
  },
  statusChip: {
    ...typography.caption,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  customerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  phone: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: deliveryTheme.accent,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.background,
  },
  address: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  itemMain: { flex: 1 },
  itemName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: deliveryTheme.border,
    marginVertical: spacing.sm,
  },
  footerSafe: {
    backgroundColor: deliveryTheme.surface,
    borderTopWidth: 1,
    borderTopColor: deliveryTheme.border,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.accent,
    ...shadows.sm,
  },
  navBtnText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '800',
  },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.onlineBg,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  deliverBtnText: {
    ...typography.button,
    color: deliveryTheme.online,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: deliveryTheme.primary,
    textAlign: 'center',
  },
  modalBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  modalSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    ...typography.button,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryDisabled: { opacity: 0.6 },
  modalPrimaryText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '800',
  },
  pressed: { opacity: 0.88 },
});

export default DeliveryOrderDetailScreen;
