import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { AuthStackParamList } from '@/navigation/types';
import {
  AgentDeliveredOrderCard,
  SectionHeader,
  deliveryTheme,
} from '@/components/delivery';
import {
  DELIVERY_QUEUE_PAGE_SIZE,
  fetchAgentDeliveredOrdersPage,
} from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import type { DeliveryQueueOrder } from '@/types/order.types';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

const DeliveryAgentDeliveredScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [orders, setOrders] = useState<DeliveryQueueOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchAgentDeliveredOrdersPage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: 0,
      });
      setOrders(page.orders);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.deliveredHistory.loadFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const page = await fetchAgentDeliveredOrdersPage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: 0,
      });
      setOrders(page.orders);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.deliveredHistory.loadFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setRefreshing(false);
    }
  }, [t]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchAgentDeliveredOrdersPage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: orders.length,
      });
      setOrders((prev) => [...prev, ...page.orders]);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.deliveredHistory.loadFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, orders.length, t]);

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage();
    }, [loadFirstPage]),
  );

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={deliveryTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={22} color={deliveryTheme.textOnDark} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('delivery.deliveredHistory.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('delivery.deliveredHistory.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <SectionHeader title={t('delivery.deliveredHistory.section')} count={totalCount} />

        {loading && orders.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={deliveryTheme.accent} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={32} color={deliveryTheme.accent} />
            </View>
            <Text style={styles.emptyTitle}>{t('delivery.deliveredHistory.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('delivery.deliveredHistory.emptyBody')}</Text>
          </View>
        ) : (
          <>
            {orders.map((order) => (
              <AgentDeliveredOrderCard
                key={order.id}
                order={order}
                onPress={() =>
                  navigation.navigate('DeliveryOrderDetail', { orderId: order.id })
                }
              />
            ))}

            {hasMore ? (
              <Pressable
                onPress={() => void loadMore()}
                disabled={loadingMore}
                style={({ pressed }) => [
                  styles.showMoreBtn,
                  (pressed || loadingMore) && styles.pressed,
                  loadingMore && styles.showMoreDisabled,
                ]}
              >
                {loadingMore ? (
                  <ActivityIndicator color={deliveryTheme.accent} size="small" />
                ) : (
                  <>
                    <Text style={styles.showMoreText}>
                      {t('delivery.latestOrders.showMore')}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={deliveryTheme.accent} />
                  </>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: deliveryTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: deliveryTheme.primary,
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
    color: deliveryTheme.textOnDark,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...typography.caption,
    color: deliveryTheme.textMutedOnDark,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  centered: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: deliveryTheme.surface,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    backgroundColor: deliveryTheme.surface,
  },
  showMoreDisabled: { opacity: 0.7 },
  showMoreText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: deliveryTheme.accent,
  },
  pressed: { opacity: 0.88 },
});

export default DeliveryAgentDeliveredScreen;
