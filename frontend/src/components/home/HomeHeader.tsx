import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LocationBar } from '@/components/location';
import SearchBar from './SearchBar';
import HeroBackground from './HeroBackground';
import HomeAppUpdateCallout from './HomeAppUpdateCallout';
import HomeNotificationBell from './HomeNotificationBell';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, moderateScale, verticalScale } = theme;

const LANTERN_DESIGN = require('../../../assets/images/LanternDesign.webp');
const FLOWER_DESIGN = require('../../../assets/images/FlowerDesignn.webp');
const LIGHTING_DESIGN_2 = require('../../../assets/images/LightingDesign2.webp');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LANTERN_WIDTH = SCREEN_WIDTH * 0.62;
const LANTERN_HEIGHT = verticalScale(108);
const BRAND_FLOWER_SIZE = moderateScale(16);

interface HomeHeaderProps {
  onSearchPress: () => void;
  onMicPress?: () => void;
  isScrolling?: boolean;
  onAccountPress?: () => void;
  onNotificationsPress?: () => void;
  hasUnreadNotifications?: boolean;
  addressLabel?: string;
  addressTag?: string;
  onLocationPress?: () => void;
  onUploadScanPress?: () => void;
  showAppUpdateCallout?: boolean;
  hasUnreadAppUpdate?: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onSearchPress,
  onMicPress,
  isScrolling = false,
  onAccountPress,
  onNotificationsPress,
  hasUnreadNotifications = false,
  addressLabel,
  addressTag,
  onLocationPress,
  onUploadScanPress,
  showAppUpdateCallout = false,
  hasUnreadAppUpdate = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const resolvedAddressLabel = addressLabel ?? t('home.addDeliveryAddress');
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  return (
    <View style={styles.heroWrapper}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <HeroBackground pauseAnimation={isScrolling} />
        <Image
          source={LANTERN_DESIGN}
          style={styles.lanternDecor}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      <View style={[styles.heroContent, { paddingTop: topInset + spacing.sm }]}>
        <View style={styles.topRow}>
          <Animated.View
            entering={FadeInDown.delay(60).duration(450).springify()}
            style={styles.deliveryBlock}
          >
            <View style={styles.brandRow}>
              <Text style={styles.deliveryLabel}>{t('home.snehealIn')}</Text>
              <Image
                source={FLOWER_DESIGN}
                style={styles.brandFlower}
                contentFit="contain"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>
            <View style={styles.deliveryTimeRow}>
              <View style={styles.deliveryTimeWrap}>
                <Image
                  source={LIGHTING_DESIGN_2}
                  style={styles.lightingAboveCare}
                  contentFit="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <Text style={styles.deliveryTime}>{t('home.deliveryTime')}</Text>
              </View>
              {/* Pharmacy pill — hidden for Diwali header layout
              <View style={styles.deliveryBadge}>
                <Ionicons
                  name="medkit-outline"
                  size={moderateScale(11)}
                  color={colors.headerAccent}
                />
                <Text style={styles.deliveryBadgeText}>{t('home.pharmacy')}</Text>
              </View>
              */}
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(450).springify()}
            style={styles.topActions}
          >
            <View style={styles.notifAnchor}>
              <HomeNotificationBell
                onPress={onNotificationsPress}
                hasUnread={hasUnreadNotifications}
                ringActive={hasUnreadAppUpdate}
                accessibilityLabel={t('home.openNotifications')}
              />
              <HomeAppUpdateCallout
                visible={showAppUpdateCallout}
                message={t('home.appUpdateCallout')}
              />
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={onAccountPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={t('home.openAccount')}
              accessibilityRole="button"
            >
              <Ionicons
                name="person-outline"
                size={moderateScale(20)}
                color={colors.headerTextDark}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(140).duration(450).springify()}>
          <LocationBar
            addressLabel={resolvedAddressLabel}
            addressTag={addressTag}
            onPress={onLocationPress}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(450).springify()}
          style={styles.searchSection}
        >
          <SearchBar
            onPress={onSearchPress}
            onMicPress={onMicPress}
            onDocumentPress={onUploadScanPress}
            insideHeader
            elevated
          />
        </Animated.View>
      </View>

      <View style={styles.waveFill} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
  lanternDecor: {
    position: 'absolute',
    top: verticalScale(16),
    left: SCREEN_WIDTH * 0.26,
    width: LANTERN_WIDTH,
    height: LANTERN_HEIGHT,
    zIndex: 1,
  },
  deliveryTimeWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  lightingAboveCare: {
    position: 'absolute',
    top: -moderateScale(28),
    left: moderateScale(118),
    width: moderateScale(50),
    height: moderateScale(50),
    zIndex: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 1,
  },
  brandFlower: {
    width: BRAND_FLOWER_SIZE,
    height: BRAND_FLOWER_SIZE,
    marginTop: 1,
    opacity: 0.95,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    zIndex: 2,
    width: '100%',
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
    zIndex: 4,
  },
  deliveryBlock: {
    flex: 1,
    minWidth: 0,
  },
  deliveryLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.headerTextOnDark,
    letterSpacing: 0.15,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deliveryTime: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: colors.headerTextOnDark,
    letterSpacing: -0.8,
    lineHeight: moderateScale(30),
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.headerBadgeBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.headerBadgeBorder,
  },
  deliveryBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: colors.headerBadgeText,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flexShrink: 0,
  },
  notifAnchor: {
    position: 'relative',
    alignItems: 'center',
  },
  actionBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: colors.headerGlass,
    borderWidth: 1,
    borderColor: colors.headerGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSection: {
    marginBottom: 0,
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
