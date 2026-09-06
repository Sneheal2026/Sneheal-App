import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import type { ScannedMedicine } from '@/types/prescription';

const { spacing, typography, borderRadius, moderateScale } = theme;

const SCAN = {
  ink: '#1B1238',
  inkSoft: '#4A3B6E',
  muted: '#8B7AA8',
  surface: '#FFFFFF',
  violet: '#7C3AED',
  violetSoft: '#EDE9FE',
  cyanSoft: '#CFFAFE',
  mint: '#059669',
  mintSoft: '#D1FAE5',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  rose: '#E11D48',
} as const;

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
              <Ionicons name="search" size={moderateScale(15)} color={SCAN.violet} />
            </Pressable>
          </View>

          {medicine.hasSpellingError && medicine.detectedName !== medicine.correctedName ? (
            <View style={styles.correctionRow}>
              <Ionicons name="sparkles" size={12} color={SCAN.amber} />
              <Text style={styles.correctionText}>
                Detected as "<Text style={styles.correctionStrike}>{medicine.detectedName}</Text>" — auto-corrected
              </Text>
            </View>
          ) : null}

          {medicine.genericName ? (
            <View style={styles.genericRow}>
              <Ionicons name="flask-outline" size={12} color={SCAN.muted} />
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
    backgroundColor: SCAN.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.12)',
    borderLeftWidth: 3,
    borderLeftColor: SCAN.violet,
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
    color: SCAN.ink,
    flex: 1,
  },
  searchBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: SCAN.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.16)',
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
    backgroundColor: SCAN.amberSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  correctionText: {
    fontSize: moderateScale(11),
    color: SCAN.amber,
    fontWeight: '500',
    flex: 1,
  },
  correctionStrike: {
    textDecorationLine: 'line-through',
    color: SCAN.rose,
  },
  genericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genericText: {
    ...typography.caption,
    color: SCAN.inkSoft,
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
    backgroundColor: SCAN.violetSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  brandTagText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: SCAN.violet,
  },
  formTag: {
    backgroundColor: SCAN.mintSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  formTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: SCAN.mint,
  },
  mfgTag: {
    backgroundColor: SCAN.cyanSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  mfgTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#0E7490',
  },
  number: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: SCAN.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.caption,
    fontWeight: '800',
    color: SCAN.surface,
  },
});

export default memo(ScannedMedicineCard);
