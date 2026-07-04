import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, StatusBar, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import type { DeliveryOrder } from '@/components/delivery';

const { spacing } = theme;

const ACTIVE_ORDERS: DeliveryOrder[] = [
  {
    id: '1',
    orderId: '#SNH-4821',
    customer: 'Priya Sharma',
    address: '12, MG Road, Shivaji Nagar, Pune',
    items: 3,
    distance: '2.4 km',
    eta: '18 min',
    status: 'ready',
    statusLabel: 'Ready for pickup',
  },
  {
    id: '2',
    orderId: '#SNH-4819',
    customer: 'Rahul Mehta',
    address: '45, FC Road, Deccan, Pune',
    items: 1,
    distance: '4.1 km',
    eta: '26 min',
    status: 'transit',
    statusLabel: 'In transit',
  },
];

const DeliveryAgentHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [isOnline, setIsOnline] = useState(true);

  const handleNavigateOrder = useCallback(
    (order: DeliveryOrder) => {
      navigation.navigate('DeliveryNavigation', {
        orderId: order.orderId,
        customerAddress: order.address,
      });
    },
    [navigation],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
      >
        <SectionHeader title="Active orders" count={ACTIVE_ORDERS.length} />

        {ACTIVE_ORDERS.length === 0 ? (
          <DeliveryEmptyState isOnline={isOnline} />
        ) : (
          ACTIVE_ORDERS.map((order) => (
            <ActiveDeliveryCard
              key={order.id}
              order={order}
              onNavigate={() => handleNavigateOrder(order)}
            />
          ))
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
  scroll: {
    flex: 1,
  },
});

export default DeliveryAgentHomeScreen;
