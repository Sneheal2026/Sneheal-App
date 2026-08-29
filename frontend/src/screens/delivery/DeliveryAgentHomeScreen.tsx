import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';
import {
  DeliveryHomeHeader,
  OnlineStatusCard,
  SectionHeader,
  ActiveDeliveryCard,
  DeliveryEmptyState,
  deliveryTheme,
} from '@/components/delivery';
import DevResetStorageButton from '@/components/common/DevResetStorageButton';
import type { DeliveryOrder, DeliveryStatus } from '@/components/delivery';
import {
  fetchDeliveryQueue,
  updateOrderStatus,
} from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import type { DeliveryQueueOrder } from '@/types/order.types';

const { spacing } = theme;

const toDeliveryStatus = (status: DeliveryQueueOrder['status']): DeliveryStatus => {
  if (status === 'out_for_delivery') return 'transit';
  if (status === 'delivered') return 'delivered';
  return 'ready';
};

const formatAddress = (order: DeliveryQueueOrder) =>
  [order.flatNumber, order.addressLine, order.landmark].filter(Boolean).join(', ');

const toCard = (order: DeliveryQueueOrder): DeliveryOrder => ({
  id: order.id,
  orderId: order.publicId,
  customer: order.receiverName,
  address: formatAddress(order),
  items: order.itemCount,
  distance: '—',
  eta: '—',
  status: toDeliveryStatus(order.status),
  mobile: order.mobile,
  coords: order.coords,
});

const DeliveryAgentHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [isOnline, setIsOnline] = useState(true);
  const [active, setActive] = useState<DeliveryOrder[]>([]);
  const [completed, setCompleted] = useState<DeliveryOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const queue = await fetchDeliveryQueue();
      setActive(queue.active.map(toCard));
      setCompleted(queue.completed.map(toCard));
    } catch (err) {
      Alert.alert(
        t('delivery.loadQueueFailed'),
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleCall = useCallback((order: DeliveryOrder) => {
    if (!order.mobile) return;
    void Linking.openURL(`tel:${order.mobile}`);
  }, []);

  const handleNavigateOrder = useCallback(
    async (order: DeliveryOrder) => {
      if (startingId) return;
      setStartingId(order.id);
      try {
        if (order.status === 'ready') {
          await updateOrderStatus(order.id, 'out_for_delivery');
          setActive((rows) =>
            rows.map((row) => (row.id === order.id ? { ...row, status: 'transit' } : row)),
          );
        }
        navigation.navigate('DeliveryNavigation', {
          orderId: order.id,
          publicId: order.orderId,
          customerAddress: order.address,
          customerCoords: order.coords,
          customerMobile: order.mobile,
        });
      } catch (err) {
        Alert.alert(
          t('delivery.startDeliveryFailed'),
          err instanceof ApiError ? err.message : undefined,
        );
      } finally {
        setStartingId(null);
      }
    },
    [navigation, startingId, t],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('delivery.goodMorning');
    if (hour < 17) return t('delivery.goodAfternoon');
    return t('delivery.goodEvening');
  }, [t]);

  const visibleActive = isOnline ? active : [];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={deliveryTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <DeliveryHomeHeader
        greeting={greeting}
        isOnline={isOnline}
        onNotificationsPress={() => navigation.navigate('Notifications' as never)}
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
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <SectionHeader title={t('delivery.activeOrders')} count={visibleActive.length} />

        {visibleActive.length === 0 ? (
          <DeliveryEmptyState isOnline={isOnline} />
        ) : (
          visibleActive.map((order) => (
            <ActiveDeliveryCard
              key={order.id}
              order={order}
              onCall={() => handleCall(order)}
              onNavigate={() => void handleNavigateOrder(order)}
            />
          ))
        )}

        {completed.length > 0 ? (
          <>
            <SectionHeader title={t('delivery.completedOrders')} count={completed.length} />
            {completed.map((order) => (
              <ActiveDeliveryCard
                key={order.id}
                order={order}
                onCall={() => handleCall(order)}
              />
            ))}
          </>
        ) : null}

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
});

export default DeliveryAgentHomeScreen;
