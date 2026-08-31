import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  fetchOrderByPublicId,
  markOrderDeliveredByPublicId,
  invalidateOrdersCache,
} from '@/services/orderService';
import { setOrderStatus } from '@/services/firebase';
import { ApiError } from '@/services/apiClient';
import { formatInr } from '@/utils/cartBilling';
import type { OrderDetail } from '@/types/order.types';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;
const NAVY = '#111152';
const PAGE_BG = '#F5F6F8';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'DeliveryConfirm'>;

const DeliveryConfirmScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [publicId, setPublicId] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [looking, setLooking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedId = publicId.trim();
  const alreadyDelivered = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled';

  const reset = useCallback(() => {
    setPublicId('');
    setOrder(null);
    setDelivered(false);
    setError(null);
  }, []);

  const handleFind = useCallback(async () => {
    if (!trimmedId || looking) return;
    setLooking(true);
    setError(null);
    setDelivered(false);
    try {
      const found = await fetchOrderByPublicId(trimmedId);
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setError(
        err instanceof ApiError && err.status === 404
          ? t('deliveryConfirm.notFound')
          : err instanceof ApiError
            ? err.message
            : t('deliveryConfirm.lookupFailed'),
      );
    } finally {
      setLooking(false);
    }
  }, [trimmedId, looking, t]);

  const handleConfirm = useCallback(async () => {
    if (!order || confirming || alreadyDelivered || isCancelled) return;
    setConfirming(true);
    setError(null);
    try {
      const updated = await markOrderDeliveredByPublicId(order.publicId);
      setOrder(updated);
      setDelivered(true);
      invalidateOrdersCache();
      // Live-mirror to Firebase so the customer's open tracker flips instantly.
      try {
        await setOrderStatus(updated.id, 'delivered');
      } catch {
        // Non-fatal: MySQL is already updated; customer will see it on next load.
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t('deliveryConfirm.updateFailed'),
      );
    } finally {
      setConfirming(false);
    }
  }, [order, confirming, alreadyDelivered, isCancelled, t]);

  const summary = useMemo(() => {
    if (!order) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardPublicId}>{order.publicId}</Text>
          <Text
            style={[
              styles.statusChip,
              order.status === 'delivered' && styles.statusDelivered,
              order.status === 'cancelled' && styles.statusCancelled,
            ]}
          >
            {t(`orders.status.${order.status}`)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('deliveryConfirm.deliverTo')}</Text>
          <View style={styles.rowValueBlock}>
            <Text style={styles.rowValue}>{order.address.receiverName}</Text>
            <Text style={styles.rowSub}>{order.address.mobile}</Text>
            <Text style={styles.rowSub}>
              {order.address.flatNumber}, {order.address.addressLine}
            </Text>
          </View>
        </View>

        <View style={styles.rowInline}>
          <Text style={styles.rowLabel}>{t('deliveryConfirm.items')}</Text>
          <Text style={styles.rowValue}>{order.items.length}</Text>
        </View>

        <View style={styles.rowInline}>
          <Text style={styles.rowLabel}>{t('deliveryConfirm.amount')}</Text>
          <Text style={styles.amount}>{formatInr(order.grandTotal)}</Text>
        </View>
      </View>
    );
  }, [order, t]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('deliveryConfirm.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('deliveryConfirm.subtitle')}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.inputLabel}>{t('deliveryConfirm.inputLabel')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={publicId}
              onChangeText={(text) => {
                setPublicId(text);
                if (order) setOrder(null);
                if (delivered) setDelivered(false);
              }}
              placeholder={t('deliveryConfirm.inputPlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={handleFind}
              editable={!confirming}
            />
            <Pressable
              onPress={handleFind}
              disabled={!trimmedId || looking}
              style={({ pressed }) => [
                styles.findBtn,
                (!trimmedId || looking) && styles.findBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {looking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.findBtnText}>{t('deliveryConfirm.findBtn')}</Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {summary}

          {delivered ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color="#047857" />
              <View style={styles.flex}>
                <Text style={styles.successTitle}>
                  {t('deliveryConfirm.successTitle')}
                </Text>
                <Text style={styles.successBody}>
                  {t('deliveryConfirm.successBody', { publicId: order?.publicId ?? '' })}
                </Text>
              </View>
            </View>
          ) : null}

          {order && !delivered && alreadyDelivered ? (
            <Text style={styles.noteText}>{t('deliveryConfirm.alreadyDelivered')}</Text>
          ) : null}
          {order && !delivered && isCancelled ? (
            <Text style={styles.noteText}>{t('deliveryConfirm.cancelledOrder')}</Text>
          ) : null}
        </ScrollView>

        {order ? (
          <View style={styles.footer}>
            {delivered ? (
              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
              >
                <Text style={styles.confirmBtnText}>{t('deliveryConfirm.another')}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleConfirm}
                disabled={confirming || alreadyDelivered || isCancelled}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  (confirming || alreadyDelivered || isCancelled) &&
                    styles.confirmBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>
                      {t('deliveryConfirm.confirmBtn')}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  flex: { flex: 1 },
  headerSafe: { backgroundColor: NAVY },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: NAVY,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
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
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  findBtn: {
    backgroundColor: NAVY,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findBtnDisabled: { opacity: 0.5 },
  findBtnText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPublicId: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: NAVY,
  },
  statusChip: {
    ...typography.caption,
    fontWeight: '700',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusDelivered: { color: '#047857', backgroundColor: '#D1FAE5' },
  statusCancelled: { color: '#6B7280', backgroundColor: '#F3F4F6' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowValueBlock: { flex: 1, alignItems: 'flex-end' },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  rowSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  amount: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
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
  noteText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  confirmBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: NAVY,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '800',
  },
  pressed: { opacity: 0.85 },
});

export default DeliveryConfirmScreen;
