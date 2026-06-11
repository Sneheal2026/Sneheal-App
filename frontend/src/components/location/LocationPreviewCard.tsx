import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, typography, shadows, moderateScale } = theme;

interface LocationPreviewCardProps {
  areaName: string;
  formattedAddress: string;
  isLoading?: boolean;
  isUpdating?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

const LocationPreviewCard: React.FC<LocationPreviewCardProps> = ({
  areaName,
  formattedAddress,
  isLoading = false,
  isUpdating = false,
  confirmDisabled = false,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.card, { paddingBottom: spacing.xxl + insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Ionicons name="location" size={20} color={colors.accentGold} />
        </View>
        <Text style={styles.title}>Order will be delivered here</Text>
      </View>

      <View style={styles.addressSection}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Detecting address...</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.locality, isUpdating && styles.dimmed]} numberOfLines={1}>
              {areaName}
            </Text>
            <Text style={[styles.address, isUpdating && styles.dimmed]} numberOfLines={2}>
              {formattedAddress}
            </Text>
            {isUpdating && (
              <View style={styles.updatingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.updatingText}>Updating address...</Text>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, confirmDisabled && styles.confirmButtonDisabled]}
        onPress={onConfirm}
        activeOpacity={0.85}
        disabled={confirmDisabled}
      >
        <Text style={styles.confirmText}>Confirm & proceed</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconWrapper: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: `${colors.accentGold}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  addressSection: {
    marginBottom: spacing.lg,
    minHeight: 60,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    ...typography.body,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  locality: {
    ...typography.h3,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.body,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    lineHeight: 20,
  },
  dimmed: {
    opacity: 0.5,
  },
  updatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  updatingText: {
    ...typography.body,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGold,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    ...typography.button,
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.white,
  },
});

export default LocationPreviewCard;
