import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;

const ACTIVE_DELIVERIES = [
  {
    id: '1',
    orderId: '#SNH-4821',
    customer: 'Priya Sharma',
    address: '12, MG Road, Pune',
    items: 3,
    distance: '2.4 km',
    status: 'Ready for pickup',
  },
  {
    id: '2',
    orderId: '#SNH-4819',
    customer: 'Rahul Mehta',
    address: '45, FC Road, Pune',
    items: 1,
    distance: '4.1 km',
    status: 'In transit',
  },
];

const STATS = [
  { label: "Today's deliveries", value: '8', icon: 'bicycle-outline' as const },
  { label: 'Earnings today', value: '₹640', icon: 'wallet-outline' as const },
  { label: 'Rating', value: '4.9', icon: 'star-outline' as const },
];

const DeliveryAgentHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.surface}
        translucent={Platform.OS === 'android'}
      />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.agentName}>Delivery Agent</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Notifications' as never)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <View style={styles.badge} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setIsOnline((prev) => !prev)}
          style={({ pressed }) => [
            styles.statusRow,
            !isOnline && styles.statusRowOffline,
            pressed && styles.pressed,
          ]}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOnline }}
        >
          <View style={[styles.statusDot, !isOnline && styles.statusDotOffline]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online — accepting orders' : 'Offline — tap to go online'}
          </Text>
        </Pressable>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color={colors.secondary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Active deliveries</Text>

        {ACTIVE_DELIVERIES.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No active deliveries</Text>
            <Text style={styles.emptyText}>
              New orders will show up here when you are online.
            </Text>
          </View>
        ) : (
          ACTIVE_DELIVERIES.map((delivery) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <Text style={styles.orderId}>{delivery.orderId}</Text>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{delivery.status}</Text>
                </View>
              </View>

              <Text style={styles.customerName}>{delivery.customer}</Text>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.addressText}>{delivery.address}</Text>
              </View>

              <Text style={styles.metaText}>
                {delivery.items} items · {delivery.distance}
              </Text>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>View route</Text>
                <Ionicons name="navigate-outline" size={16} color={colors.textInverse} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  agentName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.successLight,
    gap: spacing.sm,
  },
  statusRowOffline: {
    backgroundColor: colors.surfaceSecondary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusDotOffline: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  deliveryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderId: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.secondary,
  },
  statusChip: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  customerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  actionBtnText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});

export default DeliveryAgentHomeScreen;
