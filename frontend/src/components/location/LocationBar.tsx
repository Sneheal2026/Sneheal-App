import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, moderateScale } = theme;

export interface LocationBarProps {
  addressLabel: string;
  addressTag?: string;
  onPress?: () => void;
}

const LocationBar: React.FC<LocationBarProps> = ({
  addressLabel,
  addressTag,
  onPress,
}) => {
  return (
    <View style={styles.locationRow}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        disabled={!onPress}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Open map with your live location"
      >
        <Ionicons
          name="location-sharp"
          size={moderateScale(14)}
          color={colors.headerAccent}
          style={styles.locationPin}
        />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.locationScroll}
        contentContainerStyle={styles.locationScrollContent}
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}
        alwaysBounceHorizontal={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.75}
          disabled={!onPress}
          style={styles.locationTapArea}
          accessibilityRole="button"
          accessibilityLabel="Open map with your live location"
        >
          <Text style={styles.locationText}>
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
        </TouchableOpacity>
      </ScrollView>

      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Open map with your live location"
        >
          <Ionicons
            name="chevron-down"
            size={moderateScale(14)}
            color={colors.headerTextMutedOnDark}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
    flexGrow: 0,
  },
  locationTapArea: {
    flexShrink: 0,
  },
  locationText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    flexShrink: 0,
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
});

export default React.memo(LocationBar);
