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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { withAlpha } from '@/utils/colorUtils';

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

type ListRow =
  | { type: 'header'; id: string; label: string }
  | { type: 'item'; id: string; item: NotificationItem };

const EMPTY_HINTS: {
  key: 'hintOrders' | 'hintReminders' | 'hintOffers';
  icon: NotificationIcon;
}[] = [
  { key: 'hintOrders', icon: 'bicycle-outline' },
  { key: 'hintReminders', icon: 'alarm-outline' },
  { key: 'hintOffers', icon: 'pricetag-outline' },
];

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isEmpty = notifications.length === 0;

  const listData = useMemo<ListRow[]>(() => {
    const today = notifications.filter((n) => n.section === 'today');
    const earlier = notifications.filter((n) => n.section === 'earlier');
    const rows: ListRow[] = [];

    if (today.length > 0) {
      rows.push({ type: 'header', id: 'header-today', label: t('notifications.today') });
      today.forEach((item) => rows.push({ type: 'item', id: item.id, item }));
    }
    if (earlier.length > 0) {
      rows.push({ type: 'header', id: 'header-earlier', label: t('notifications.earlier') });
      earlier.forEach((item) => rows.push({ type: 'item', id: item.id, item }));
    }
    return rows;
  }, [notifications, t]);

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
        headerSpacer: {
          width: moderateScale(40),
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
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxxl,
        },
        emptyCard: {
          width: '100%',
          maxWidth: moderateScale(340),
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: borderRadius.xxl,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xxxl,
          paddingBottom: spacing.xxl,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.sm,
        },
        illustration: {
          width: moderateScale(148),
          height: moderateScale(148),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        },
        ringOuter: {
          position: 'absolute',
          width: moderateScale(148),
          height: moderateScale(148),
          borderRadius: moderateScale(74),
          borderWidth: 1,
          borderColor: withAlpha(colors.primary, 0.12),
          backgroundColor: withAlpha(colors.primary, 0.04),
        },
        ringMid: {
          position: 'absolute',
          width: moderateScale(110),
          height: moderateScale(110),
          borderRadius: moderateScale(55),
          borderWidth: 1,
          borderColor: withAlpha(colors.primary, 0.18),
          backgroundColor: withAlpha(colors.primary, 0.08),
        },
        emptyIconCircle: {
          width: moderateScale(72),
          height: moderateScale(72),
          borderRadius: moderateScale(36),
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyTitle: {
          ...typography.h3,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          fontWeight: '800',
          textAlign: 'center',
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: moderateScale(21),
          marginTop: spacing.sm,
          maxWidth: moderateScale(260),
        },
        hintRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: spacing.sm,
          marginTop: spacing.xl,
        },
        hintChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        hintText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textSecondary,
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
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0
                  ? t(unreadCount > 1 ? 'notifications.newUpdates' : 'notifications.newUpdate', {
                      count: unreadCount,
                    })
                  : t('notifications.caughtUp')}
              </Text>
            </View>

            {isEmpty ? (
              <View style={styles.headerSpacer} />
            ) : (
              <Pressable
                onPress={markAllRead}
                disabled={unreadCount === 0}
                style={({ pressed }) => [
                  styles.markReadBtn,
                  unreadCount === 0 && { opacity: 0.4 },
                  pressed && unreadCount > 0 && styles.backBtnPressed,
                ]}
                accessibilityLabel={t('notifications.markAllReadA11y')}
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-done-outline" size={20} color={colors.white} />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {isEmpty ? (
          <Animated.View entering={FadeIn.duration(380)} style={styles.emptyWrap}>
            <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.emptyCard}>
              <View style={styles.illustration}>
                <View style={styles.ringOuter} />
                <View style={styles.ringMid} />
                <LinearGradient
                  colors={[colors.infoLight, colors.white]}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons
                    name="notifications-off-outline"
                    size={moderateScale(32)}
                    color={colors.primary}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
              <Text style={styles.emptySubtitle}>{t('notifications.emptySubtitle')}</Text>

              <View style={styles.hintRow}>
                {EMPTY_HINTS.map((hint) => (
                  <View key={hint.key} style={styles.hintChip}>
                    <Ionicons
                      name={hint.icon}
                      size={moderateScale(13)}
                      color={colors.primary}
                    />
                    <Text style={styles.hintText}>{t(`notifications.${hint.key}`)}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(row) => row.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default NotificationsScreen;
