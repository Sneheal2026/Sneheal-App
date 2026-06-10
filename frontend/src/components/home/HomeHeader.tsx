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
import Animated, { FadeInDown } from 'react-native-reanimated';
import SearchBar from './SearchBar';
import HeroBackground from './HeroBackground';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const STATUS_BAR_HEIGHT = Platform.OS === 'android'
  ? StatusBar.currentHeight ?? 24
  : 0;

const UPLOAD_ACTIONS = [
  {
    id: 'prescription',
    icon: 'document-text-outline' as const,
    title: 'Upload Prescription',
  },
  {
    id: 'tablet',
    icon: 'camera-outline' as const,
    title: 'Upload Tablet Photo',
  },
];

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isScrolling?: boolean;
  onAccountPress?: () => void;
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
  isScrolling = false,
  onAccountPress,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'ios' ? insets.top : STATUS_BAR_HEIGHT;
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <View style={styles.heroWrapper}>
      <HeroBackground pauseAnimation={isScrolling} />

      <View style={[styles.heroContent, { paddingTop: topInset + spacing.md }]}>
        <View style={styles.topRow}>
          <Animated.View
            entering={FadeInDown.delay(80).duration(500).springify()}
            style={styles.greetingBlock}
          >
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName} numberOfLines={1} adjustsFontSizeToFit>
              Pranay Chepur
            </Text>
          </Animated.View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.75}
              onPress={onAccountPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Open account settings"
              accessibilityRole="button"
            >
              <Ionicons name="person" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(500).springify()}
          style={styles.locationWrap}
        >
          <TouchableOpacity style={styles.locationBar} activeOpacity={0.85}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={moderateScale(14)} color={colors.accentGold} />
            </View>
            <View style={styles.locationText}>
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
          <View style={styles.searchShell}>
            <View style={styles.searchGlow} />
            <SearchBar
              value={searchQuery}
              onChangeText={onSearchChange}
              insideHeader
              elevated
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(320).duration(500).springify()}
          style={styles.uploadPanelWrap}
        >
          <View style={styles.uploadPanel}>
            {UPLOAD_ACTIONS.map((action, index) => (
              <React.Fragment key={action.id}>
                {index > 0 && <View style={styles.uploadDivider} />}
                <TouchableOpacity style={styles.uploadRow} activeOpacity={0.85}>
                  <View style={styles.uploadIconWrap}>
                    <Ionicons
                      name={action.icon}
                      size={moderateScale(18)}
                      color={colors.white}
                    />
                  </View>
                  <Text style={styles.uploadLabel} numberOfLines={1}>
                    {action.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(16)}
                    color="rgba(255,255,255,0.45)"
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.waveFill} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    overflow: 'hidden',
    marginBottom: -spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
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
    zIndex: 20,
    elevation: 20,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  locationIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  addressText: {
    fontSize: moderateScale(13),
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
  uploadPanelWrap: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  uploadPanel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  uploadDivider: {
    height: 1,
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  uploadIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadLabel: {
    flex: 1,
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.white,
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

export default React.memo(HomeHeader);
