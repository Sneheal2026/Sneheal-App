import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';

const { spacing, typography, borderRadius } = theme;

interface DeliveryHomeHeaderProps {
  greeting: string;
  agentName?: string;
  isOnline: boolean;
  onNotificationsPress: () => void;
  hasNotifications?: boolean;
}

const DeliveryHomeHeader: React.FC<DeliveryHomeHeaderProps> = ({
  greeting,
  agentName = 'Delivery Partner',
  isOnline,
  onNotificationsPress,
  hasNotifications = true,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  return (
    <View style={[styles.wrapper, { paddingTop: topInset + spacing.md }]}>
      <View style={styles.row}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="bicycle" size={22} color={deliveryTheme.accent} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {agentName}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={deliveryTheme.textOnDark} />
          {hasNotifications ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? deliveryTheme.online : deliveryTheme.offline }]} />
        <Text style={styles.statusText}>{isOnline ? 'On duty' : 'Off duty'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: deliveryTheme.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  identityText: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: deliveryTheme.textMutedOnDark,
    marginBottom: 2,
  },
  name: {
    ...typography.h4,
    color: deliveryTheme.textOnDark,
    fontWeight: '700',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1.5,
    borderColor: deliveryTheme.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    color: deliveryTheme.textOnDark,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});

export default DeliveryHomeHeader;
