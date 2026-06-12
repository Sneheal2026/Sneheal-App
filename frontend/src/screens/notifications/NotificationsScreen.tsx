import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

type NotificationIcon = keyof typeof Ionicons.glyphMap;

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: NotificationIcon;
  accent: string;
  accentLight: string;
  unread: boolean;
  category: string;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Order on the way',
    message: 'Your medicines from order #SH-2847 are out for delivery. Expected in 25 minutes.',
    time: '5 min ago',
    icon: 'bicycle-outline',
    accent: colors.primary,
    accentLight: colors.infoLight,
    unread: true,
    category: 'Delivery',
  },
  {
    id: '2',
    title: 'Weekend wellness offer',
    message: 'Enjoy 20% off on vitamins, supplements & personal care. Use code WELL20 at checkout.',
    time: '2 hrs ago',
    icon: 'sparkles-outline',
    accent: colors.secondary,
    accentLight: '#CCFBF1',
    unread: true,
    category: 'Offer',
  },
];

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F4C9E', '#1A73E8', '#5BA3F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={8}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.markReadBtn, pressed && styles.backBtnPressed]}
                hitSlop={8}
              >
                <Text style={styles.markReadText}>Mark all read</Text>
              </Pressable>
            </View>

            <Animated.View entering={FadeInDown.duration(450)} style={styles.heroContent}>
              <View style={styles.bellWrap}>
                <View style={styles.bellRing}>
                  <Ionicons name="notifications" size={28} color={colors.white} />
                </View>
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle}>Notifications</Text>
              <Text style={styles.heroSubtitle}>
                {unreadCount > 0
                  ? `You have ${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
                  : 'You are all caught up'}
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>

        <View style={styles.heroCurve} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Today</Text>
          <View style={styles.sectionLine} />
        </Animated.View>

        {NOTIFICATIONS.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInRight.delay(120 + index * 80).duration(450).springify()}
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                item.unread && styles.cardUnread,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.accentStripe, { backgroundColor: item.accent }]} />

              <View style={[styles.iconWrap, { backgroundColor: item.accentLight }]}>
                <Ionicons name={item.icon} size={moderateScale(22)} color={item.accent} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.categoryPill, { backgroundColor: item.accentLight }]}>
                    <Text style={[styles.categoryText, { color: item.accent }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
              </View>

              {item.unread && <View style={styles.unreadDot} />}
            </Pressable>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerText}>
            Order & health alerts appear here. Offers are personalised for you.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroGradient: {
    paddingBottom: spacing.xl,
  },
  heroInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.75,
  },
  markReadBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  markReadText: {
    ...typography.caption,
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  bellWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  bellRing: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: '#0F4C9E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  bellBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: colors.white,
  },
  heroTitle: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  heroCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
  scroll: {
    flex: 1,
    marginTop: -spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardUnread: {
    borderColor: 'rgba(26,115,232,0.2)',
    backgroundColor: '#FAFCFF',
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  iconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  timeText: {
    ...typography.caption,
    fontSize: moderateScale(11),
    color: colors.textMuted,
    fontWeight: '600',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardMessage: {
    ...typography.body,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(19),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
  },
  footerText: {
    flex: 1,
    ...typography.caption,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default NotificationsScreen;
