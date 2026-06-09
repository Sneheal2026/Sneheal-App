import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import SearchBar from './SearchBar';
import HeroBackground from './HeroBackground';
import theme from '@/styles/theme';
import device from '@/styles/device';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const STATUS_BAR_HEIGHT = Platform.OS === 'android'
  ? StatusBar.currentHeight ?? 24
  : 0;

const UPLOAD_ACTIONS = [
  {
    id: 'prescription',
    icon: 'document-text' as const,
    title: 'Upload Prescription',
    subtitle: 'Snap or upload Rx',
  },
  {
    id: 'tablet',
    icon: 'camera' as const,
    title: 'Upload Tablet Pic',
    subtitle: 'Identify medicine',
  },
];

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  scrollY?: SharedValue<number>;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const HomeHeader: React.FC<HomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  scrollY: externalScrollY,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'ios' ? insets.top : STATUS_BAR_HEIGHT;
  const greeting = useMemo(() => getGreeting(), []);

  const headerParallax = useAnimatedStyle(() => ({
    transform: externalScrollY
      ? [
          {
            translateY: interpolate(
              externalScrollY.value,
              [0, 120],
              [0, -24],
              Extrapolation.CLAMP,
            ),
          },
        ]
      : [],
  }));

  const searchLift = useAnimatedStyle(() => ({
    transform: externalScrollY
      ? [
          {
            translateY: interpolate(
              externalScrollY.value,
              [0, 100],
              [0, -8],
              Extrapolation.CLAMP,
            ),
          },
          {
            scale: interpolate(
              externalScrollY.value,
              [0, 100],
              [1, 0.98],
              Extrapolation.CLAMP,
            ),
          },
        ]
      : [],
    opacity: externalScrollY
      ? interpolate(externalScrollY.value, [0, 80], [1, 0.92], Extrapolation.CLAMP)
      : 1,
  }));

  return (
    <View style={styles.heroWrapper}>
      <HeroBackground scrollY={externalScrollY} />

      <Animated.View style={headerParallax}>
        <View style={[styles.heroContent, { paddingTop: topInset + spacing.md }]}>
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName} numberOfLines={1} adjustsFontSizeToFit>
                Pranay Chepur
              </Text>
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.glassBtn} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.8}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(500).springify()}
          style={styles.locationWrap}
        >
          <TouchableOpacity style={styles.locationBar} activeOpacity={0.85}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={moderateScale(16)} color={colors.accentGold} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.deliverLabel}>Deliver to</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                Hyderabad, 500032
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={moderateScale(16)}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500).springify()}>
          <Animated.View style={[styles.searchShell, searchLift]}>
            <View style={styles.searchGlow} />
            <SearchBar
              value={searchQuery}
              onChangeText={onSearchChange}
              insideHeader
              elevated
            />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(320).duration(500).springify()}
          style={[styles.uploadRow, device.isSmallDevice && styles.uploadRowStacked]}
        >
          {UPLOAD_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.uploadCard}
              activeOpacity={0.85}
            >
              <View style={styles.uploadIconBox}>
                <Ionicons name={action.icon} size={moderateScale(18)} color={colors.white} />
              </View>
              <View style={styles.uploadTextWrap}>
                <Text style={styles.uploadTitle} numberOfLines={2}>
                  {action.title}
                </Text>
                <Text style={styles.uploadSubtitle} numberOfLines={1}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(16)}
                color="rgba(255,255,255,0.45)"
                style={styles.uploadChevron}
              />
            </TouchableOpacity>
          ))}
        </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.waveFill} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    overflow: 'hidden',
    marginBottom: -spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    zIndex: 2,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.caption,
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userName: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  glassBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: 'rgba(6,20,40,0.5)',
  },
  avatarBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  locationWrap: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  locationIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(245,185,66,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
  },
  deliverLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
  addressText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.white,
  },
  searchShell: {
    position: 'relative',
    marginBottom: spacing.md,
    width: '100%',
  },
  searchGlow: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(26,115,232,0.35)',
    opacity: 0.5,
  },
  uploadRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  uploadRowStacked: {
    flexDirection: 'column',
  },
  uploadCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  uploadIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  uploadTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.white,
    lineHeight: moderateScale(16),
  },
  uploadSubtitle: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  uploadChevron: {
    flexShrink: 0,
  },
  waveFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    zIndex: 3,
  },
});

export default HomeHeader;
