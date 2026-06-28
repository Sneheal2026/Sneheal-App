import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SearchBar from './SearchBar';
import HeroBackground from './HeroBackground';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, moderateScale } = theme;

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onMicPress?: () => void;
  isVoiceListening?: boolean;
  isScrolling?: boolean;
  onAccountPress?: () => void;
  onNotificationsPress?: () => void;
  addressLabel?: string;
  addressTag?: string;
  onLocationPress?: () => void;
  onUploadScanPress?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onMicPress,
  isVoiceListening = false,
  isScrolling = false,
  onAccountPress,
  onNotificationsPress,
  addressLabel = 'Add delivery address',
  addressTag,
  onLocationPress,
  onUploadScanPress,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const renderLocationContent = () => (
    <>
      <Ionicons
        name="location-sharp"
        size={moderateScale(14)}
        color={colors.headerAccent}
        style={styles.locationPin}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.locationScroll}
        contentContainerStyle={styles.locationScrollContent}
        nestedScrollEnabled
        directionalLockEnabled
      >
        <Text style={styles.locationText} numberOfLines={1}>
          {addressTag ? (
            <>
              <Text style={styles.locationTag}>{addressTag}</Text>
              <Text style={styles.locationSeparator}> · </Text>
              <Text style={styles.locationAddress}>{addressLabel}</Text>
            </>
          ) : (
            <Text style={styles.locationAddress}>{addressLabel}</Text>
          )}
        </Text>
      </ScrollView>
      {onLocationPress ? (
        <Ionicons
          name="chevron-down"
          size={moderateScale(14)}
          color={colors.headerTextMutedOnDark}
        />
      ) : null}
    </>
  );

  return (
    <View style={styles.heroWrapper}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <HeroBackground pauseAnimation={isScrolling} />
      </View>

      <View style={[styles.heroContent, { paddingTop: topInset + spacing.sm }]}>
        <View style={styles.topRow}>
          <Animated.View
            entering={FadeInDown.delay(60).duration(450).springify()}
            style={styles.deliveryBlock}
          >
            <Text style={styles.deliveryLabel}>Sneheal in</Text>
            <View style={styles.deliveryTimeRow}>
              <Text style={styles.deliveryTime}>30 minutes</Text>
              <View style={styles.deliveryBadge}>
                <Ionicons
                  name="medkit-outline"
                  size={moderateScale(11)}
                  color={colors.headerAccent}
                />
                <Text style={styles.deliveryBadgeText}>Pharmacy</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(450).springify()}
            style={styles.topActions}
          >
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={onNotificationsPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Open notifications"
              accessibilityRole="button"
            >
              <Ionicons
                name="notifications-outline"
                size={moderateScale(20)}
                color={colors.headerTextDark}
              />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={onAccountPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Open account settings"
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
          {onLocationPress ? (
            <TouchableOpacity
              style={styles.locationRow}
              onPress={onLocationPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Change delivery location"
            >
              {renderLocationContent()}
            </TouchableOpacity>
          ) : (
            <View style={styles.locationRow} accessibilityRole="text">
              {renderLocationContent()}
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(450).springify()}
          style={styles.searchSection}
        >
          <SearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            onMicPress={onMicPress}
            onDocumentPress={onUploadScanPress}
            isListening={isVoiceListening}
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
  },
  deliveryBlock: {
    flex: 1,
    minWidth: 0,
  },
  deliveryLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.headerTextMutedOnDark,
    letterSpacing: 0.2,
    marginBottom: 1,
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
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
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
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
    minHeight: moderateScale(24),
  },
  locationPin: {
    flexShrink: 0,
  },
  locationScroll: {
    flex: 1,
    minWidth: 0,
  },
  locationScrollContent: {
    alignItems: 'center',
  },
  locationText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  locationTag: {
    fontWeight: '800',
    color: colors.headerTextOnDark,
    letterSpacing: 0.3,
  },
  locationSeparator: {
    fontWeight: '500',
    color: colors.headerTextMutedOnDark,
  },
  locationAddress: {
    fontWeight: '500',
    color: colors.headerTextMutedOnDark,
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
