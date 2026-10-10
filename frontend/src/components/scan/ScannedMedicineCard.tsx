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

const STRENGTH_OR_FORM =
  /\b(?:\d+(?:\.\d+)?\s*(?:micrograms?|milligrams?|millilit(?:re|er)s?|mcg|mg|gms?|ug|g|ml|iu|%)|tablets?|capsules?|syrups?|injections?|drops|creams?|ointments?|gels?|suspensions?|inhalers?|sachets?)\b/gi;

/** Search box uses the medicine name. Strength and form are not part of the query. */
export const getMedicineSearchQuery = (medicine: ScannedMedicine): string => {
  const brand = (medicine.brandName || '').trim();
  const generic = (medicine.genericName || '').trim();
  const corrected = (medicine.correctedName || '').trim();
  const detected = (medicine.detectedName || '').trim();
  const brandWords = brand.split(/\s+/).filter(Boolean);

  if (brand.length >= 2 && brandWords.length <= 3) {
    return brand;
  }

  const source = corrected || generic || detected;
  const name = source.replace(STRENGTH_OR_FORM, ' ').replace(/\s+/g, ' ').trim();
  return name || source;
};

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
    <Pressable
      onPress={handleSearch}
      disabled={!canSearch}
      style={({ pressed }) => [
        styles.card,
        canSearch && pressed && styles.cardPressed,
        !canSearch && styles.cardDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('scan.searchMedicineA11y', { name: searchQuery || medicine.correctedName })}
      accessibilityState={{ disabled: !canSearch }}
    >
      <View style={styles.top}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {medicine.correctedName}
            </Text>
            <View
              style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons name="search" size={moderateScale(15)} color={SCAN.violet} />
            </View>
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
    </Pressable>
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
  cardPressed: {
    opacity: 0.92,
  },
  cardDisabled: {
    opacity: 0.85,
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
