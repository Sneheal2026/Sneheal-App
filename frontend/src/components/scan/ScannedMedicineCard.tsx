import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import type { ScannedMedicine } from '@/types/prescription';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;
const ACCENT = colors.primary;

export const getMedicineSearchQuery = (medicine: ScannedMedicine): string =>
  (medicine.correctedName || medicine.brandName || medicine.detectedName || '').trim();

interface ScannedMedicineCardProps {
  medicine: ScannedMedicine;
  index: number;
  onSearchPress: (query: string) => void;
}

const ScannedMedicineCard = ({ medicine, index, onSearchPress }: ScannedMedicineCardProps) => {
  const { t } = useTranslation();
  const searchQuery = getMedicineSearchQuery(medicine);
  const canSearch = searchQuery.length > 0;

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    onSearchPress(searchQuery);
  }, [canSearch, onSearchPress, searchQuery]);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {medicine.correctedName}
            </Text>
            <Pressable
              onPress={handleSearch}
              disabled={!canSearch}
              hitSlop={6}
              style={({ pressed }) => [
                styles.searchBtn,
                pressed && canSearch && styles.searchBtnPressed,
                !canSearch && styles.searchBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('scan.searchMedicineA11y', { name: searchQuery || medicine.correctedName })}
              accessibilityState={{ disabled: !canSearch }}
            >
              <Ionicons name="search" size={moderateScale(15)} color={ACCENT} />
            </Pressable>
          </View>

          {medicine.hasSpellingError && medicine.detectedName !== medicine.correctedName ? (
            <View style={styles.correctionRow}>
              <Ionicons name="sparkles" size={12} color={colors.warning} />
              <Text style={styles.correctionText}>
                Detected as "<Text style={styles.correctionStrike}>{medicine.detectedName}</Text>" — auto-corrected
              </Text>
            </View>
          ) : null}

          {medicine.genericName ? (
            <View style={styles.genericRow}>
              <Ionicons name="flask-outline" size={12} color={colors.textMuted} />
              <Text style={styles.genericText}>{medicine.genericName}</Text>
            </View>
          ) : null}

          <View style={styles.tagRow}>
            {medicine.brandName ? (
              <View style={styles.brandTag}>
                <Text style={styles.brandTagText}>{medicine.brandName}</Text>
              </View>
            ) : null}
            {medicine.form ? (
              <View style={styles.formTag}>
                <Text style={styles.formTagText}>{medicine.form}</Text>
              </View>
            ) : null}
            {medicine.manufacturer ? (
              <View style={styles.mfgTag}>
                <Text style={styles.mfgTagText}>{medicine.manufacturer}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    ...shadows.sm,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  searchBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,115,232,0.16)',
    flexShrink: 0,
  },
  searchBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  searchBtnDisabled: {
    opacity: 0.4,
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  correctionText: {
    fontSize: moderateScale(11),
    color: '#B45309',
    fontWeight: '500',
    flex: 1,
  },
  correctionStrike: {
    textDecorationLine: 'line-through',
    color: '#DC2626',
  },
  genericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genericText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  brandTag: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  brandTagText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: ACCENT,
  },
  formTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  formTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: colors.success,
  },
  mfgTag: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  mfgTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#7C3AED',
  },
  number: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.caption,
    fontWeight: '800',
    color: ACCENT,
  },
});

export default memo(ScannedMedicineCard);
