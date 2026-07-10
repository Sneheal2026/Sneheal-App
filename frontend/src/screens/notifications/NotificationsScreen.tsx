import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

type NotificationIcon = keyof typeof Ionicons.glyphMap;

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: NotificationIcon;
  unread: boolean;
  section: 'today' | 'earlier';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Order on the way',
    message: 'Order #SH-2847 is out for delivery. Expected in about 25 minutes.',
    time: '5 min ago',
    icon: 'bicycle-outline',
    unread: true,
    section: 'today',
  },
  {
    id: '2',
    title: 'Medicine reminder',
    message: 'Time to take Paracetamol 500mg. Stay on track with your schedule.',
    time: '1 hr ago',
    icon: 'alarm-outline',
    unread: true,
    section: 'today',
  },
  {
    id: '3',
    title: 'Weekend wellness offer',
    message: '20% off vitamins & supplements. Use code WELL20 at checkout.',
    time: 'Yesterday',
    icon: 'pricetag-outline',
    unread: false,
    section: 'earlier',
  },
  {
    id: '4',
    title: 'Order delivered',
    message: 'Your medicines from order #SH-2791 were delivered successfully.',
    time: '2 days ago',
    icon: 'checkmark-circle-outline',
    unread: false,
    section: 'earlier',
  },
];

type ListRow =
  | { type: 'header'; id: string; label: string }
  | { type: 'item'; id: string; item: NotificationItem };

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const listData = useMemo<ListRow[]>(() => {
    const today = notifications.filter((n) => n.section === 'today');
    const earlier = notifications.filter((n) => n.section === 'earlier');
    const rows: ListRow[] = [];

    if (today.length > 0) {
      rows.push({ type: 'header', id: 'header-today', label: 'Today' });
      today.forEach((item) => rows.push({ type: 'item', id: item.id, item }));
    }
    if (earlier.length > 0) {
      rows.push({ type: 'header', id: 'header-earlier', label: 'Earlier' });
      earlier.forEach((item) => rows.push({ type: 'item', id: item.id, item }));
    }
    return rows;
  }, [notifications]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        hero: {
          paddingBottom: spacing.lg,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
        },
        backBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        backBtnPressed: { opacity: 0.8 },
        headerTextBlock: {
          flex: 1,
          alignItems: 'center',
        },
        headerTitle: {
          ...typography.h4,
          color: colors.white,
          fontWeight: '700',
        },
        headerSubtitle: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
        },
        markReadBtn: {
          minWidth: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.sm,
        },
        markReadBtnDisabled: {
          opacity: 0.4,
        },
        body: {
          flex: 1,
          marginTop: -spacing.sm,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          overflow: 'hidden',
        },
        listContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxxxl,
          gap: spacing.sm,
          flexGrow: 1,
        },
        listContentEmpty: {
          justifyContent: 'center',
        },
        sectionLabel: {
          ...typography.caption,
          fontSize: moderateScale(12),
          fontWeight: '700',
          color: colors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
          marginLeft: spacing.xs,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        rowUnread: {
          borderColor: colors.primaryLight,
          backgroundColor: colors.primarySurface,
        },
        rowPressed: {
          opacity: 0.88,
        },
        iconCircle: {
          width: moderateScale(44),
          height: moderateScale(44),
          borderRadius: moderateScale(22),
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        iconCircleMuted: {
          backgroundColor: colors.borderLight,
        },
        rowBody: {
          flex: 1,
          minWidth: 0,
        },
        rowTop: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginBottom: 4,
        },
        rowTitle: {
          ...typography.body,
          fontSize: moderateScale(15),
          fontWeight: '700',
          color: colors.textPrimary,
          flex: 1,
        },
        timeText: {
          ...typography.caption,
          fontSize: moderateScale(11),
          color: colors.textMuted,
          fontWeight: '500',
          flexShrink: 0,
        },
        rowMessage: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          lineHeight: moderateScale(19),
          paddingRight: spacing.md,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
          marginTop: spacing.sm,
          flexShrink: 0,
        },
        emptyWrap: {
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        emptyIconCircle: {
          width: moderateScale(88),
          height: moderateScale(88),
          borderRadius: moderateScale(44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const renderItem = ({ item, index }: { item: ListRow; index: number }) => {
    if (item.type === 'header') {
      return (
        <Animated.View entering={FadeInDown.delay(40).duration(300)}>
          <Text style={styles.sectionLabel}>{item.label}</Text>
        </Animated.View>
      );
    }

    const n = item.item;
    return (
      <Animated.View entering={FadeInDown.delay(60 + index * 40).duration(350)}>
        <Pressable
          onPress={() => markOneRead(n.id)}
          style={({ pressed }) => [
            styles.row,
            n.unread && styles.rowUnread,
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${n.title}. ${n.message}`}
        >
          <View style={[styles.iconCircle, !n.unread && styles.iconCircleMuted]}>
            <Ionicons
              name={n.icon}
              size={moderateScale(20)}
              color={n.unread ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.rowBody}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {n.title}
              </Text>
              <Text style={styles.timeText}>{n.time}</Text>
            </View>
            <Text style={styles.rowMessage} numberOfLines={2}>
              {n.message}
            </Text>
          </View>

          {n.unread ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.35, 1]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
                  : 'You are all caught up'}
              </Text>
            </View>

            <Pressable
              onPress={markAllRead}
              disabled={unreadCount === 0}
              style={({ pressed }) => [
                styles.markReadBtn,
                unreadCount === 0 && styles.markReadBtnDisabled,
                pressed && unreadCount > 0 && styles.backBtnPressed,
              ]}
              accessibilityLabel="Mark all as read"
              accessibilityRole="button"
            >
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color={colors.white}
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <FlatList
          data={listData}
          keyExtractor={(row) => row.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            listData.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
              <LinearGradient
                colors={[colors.infoLight, colors.white]}
                style={styles.emptyIconCircle}
              >
                <Ionicons
                  name="notifications-off-outline"
                  size={moderateScale(40)}
                  color={colors.primary}
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                Order updates, reminders, and offers will show up here.
              </Text>
            </Animated.View>
          }
        />
      </View>
    </View>
  );
};

export default NotificationsScreen;
