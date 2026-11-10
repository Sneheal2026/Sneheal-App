import React, { useCallback, useMemo, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { useInAppAnnouncements } from '@/context/InAppAnnouncementsContext';
import theme from '@/styles/theme';
import {
  DeliveryHomeHeader,
  OnlineStatusCard,
  SectionHeader,
  LatestOrderCard,
  DeliveryEmptyState,
  deliveryTheme,
} from '@/components/delivery';
import DevResetStorageButton from '@/components/common/DevResetStorageButton';
import {
  DELIVERY_QUEUE_PAGE_SIZE,
  fetchDeliveryQueuePage,
} from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import type { DeliveryQueueOrder } from '@/types/order.types';

const { spacing, typography, borderRadius, shadows } = theme;

const DeliveryAgentHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user } = useAuth();
  const { unreadCount: notificationUnreadCount, refreshAnnouncements } = useInAppAnnouncements();

  useFocusEffect(
    useCallback(() => {
      refreshAnnouncements();
    }, [refreshAnnouncements]),
  );
  const [isOnline, setIsOnline] = useState(true);
  const [latestOrders, setLatestOrders] = useState<DeliveryQueueOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const page = await fetchDeliveryQueuePage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: 0,
      });
      setLatestOrders(page.active);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.loadQueueFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setLoadingQueue(false);
    }
  }, [t]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const page = await fetchDeliveryQueuePage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: 0,
      });
      setLatestOrders(page.active);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.loadQueueFailed'),
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
      const page = await fetchDeliveryQueuePage({
        limit: DELIVERY_QUEUE_PAGE_SIZE,
        offset: latestOrders.length,
      });
      setLatestOrders((prev) => [...prev, ...page.active]);
      setTotalCount(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      Alert.alert(
        t('delivery.loadQueueFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, latestOrders.length, loadingMore, t]);

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage();
    }, [loadFirstPage]),
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('delivery.goodMorning');
    if (hour < 17) return t('delivery.goodAfternoon');
    return t('delivery.goodEvening');
  }, [t]);

  const visibleOrders = isOnline ? latestOrders : [];
  const sectionCount = isOnline ? totalCount : 0;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={deliveryTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <DeliveryHomeHeader
        greeting={greeting}
        agentName={user?.username?.trim() || undefined}
        isOnline={isOnline}
        onProfilePress={() => navigation.navigate('DeliveryAgentProfile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        hasUnreadNotifications={notificationUnreadCount > 0}
      />

      <OnlineStatusCard isOnline={isOnline} onToggle={setIsOnline} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <Pressable
          onPress={() => navigation.navigate('DeliveryConfirm')}
          style={({ pressed }) => [styles.markDeliveredBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('settings.deliveryConfirm')}
        >
          <Ionicons name="checkmark-done" size={20} color={theme.colors.white} />
          <Text style={styles.markDeliveredBtnText}>{t('settings.deliveryConfirm')}</Text>
        </Pressable>

        <SectionHeader title={t('delivery.latestOrders.title')} count={sectionCount} />

        {loadingQueue && visibleOrders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={deliveryTheme.accent} />
          </View>
        ) : visibleOrders.length === 0 ? (
          <DeliveryEmptyState isOnline={isOnline} />
        ) : (
          <>
            {visibleOrders.map((order) => (
              <LatestOrderCard
                key={order.id}
                order={order}
                onPress={() =>
                  navigation.navigate('DeliveryOrderDetail', { orderId: order.id })
                }
              />
            ))}

            {hasMore && isOnline ? (
              <Pressable
                onPress={() => void loadMore()}
                disabled={loadingMore}
                style={({ pressed }) => [
                  styles.showMoreBtn,
                  (pressed || loadingMore) && styles.pressed,
                  loadingMore && styles.showMoreDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('delivery.latestOrders.showMore')}
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

        <DevResetStorageButton />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: deliveryTheme.background,
  },
  scroll: {
    flex: 1,
  },
  markDeliveredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: deliveryTheme.accent,
    ...shadows.sm,
  },
  markDeliveredBtnText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.white,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    backgroundColor: deliveryTheme.surface,
  },
  showMoreDisabled: {
    opacity: 0.7,
  },
  showMoreText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: deliveryTheme.accent,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default DeliveryAgentHomeScreen;
