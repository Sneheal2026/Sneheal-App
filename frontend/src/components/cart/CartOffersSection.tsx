import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { CartOffer } from '@/types/cartQuote.types';
import { formatInr } from '@/utils/cartBilling';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const NAVY = '#111152';
const GREEN = '#0C831F';
const DIWALI_GRADIENT = ['#FF8A00', '#E85D04', '#9D0208'] as const;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  offers: CartOffer[];
  draftCode: string;
  onChangeDraftCode: (value: string) => void;
  onApplyCode: () => void;
  onClearCode: () => void;
  applyError: string | null;
  applyLoading: boolean;
};

const CartOffersSection = ({
  offers,
  draftCode,
  onChangeDraftCode,
  onApplyCode,
  onClearCode,
  applyError,
  applyLoading,
}: Props) => {
  const { t } = useTranslation();

  const featured = useMemo(
    () => offers.find((o) => o.stackGroup === 'cart' && o.promoType === 'percent_off'),
    [offers],
  );

  const others = useMemo(
    () => offers.filter((o) => o.id !== featured?.id),
    [offers, featured?.id],
  );

  if (offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('cart.offersTitle')}</Text>
        <Text style={styles.hint}>{t('cart.offersOneCartHint')}</Text>
      </View>

      {featured ? (
        <LinearGradient
          colors={[...DIWALI_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredCard}
        >
          <View style={styles.featuredTop}>
            <View style={styles.featuredBadge}>
              <Ionicons name="sparkles" size={12} color={DIWALI_GRADIENT[0]} />
              <Text style={styles.featuredBadgeText}>{t('cart.offersFestive')}</Text>
            </View>
            {featured.applied ? (
              <View style={styles.appliedPill}>
                <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                <Text style={styles.appliedPillText}>{t('cart.offersApplied')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.featuredTitle}>{featured.title}</Text>
          <Text style={styles.featuredSub}>{featured.subtitle}</Text>
          {featured.code ? (
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>{featured.code}</Text>
            </View>
          ) : null}
          {!featured.eligible && featured.gapPaise > 0 ? (
            <Text style={styles.featuredGap}>
              {t('cart.offersAddMore', { amount: formatInr(featured.gapPaise / 100) })}
            </Text>
          ) : null}
        </LinearGradient>
      ) : null}

      <View style={styles.listCard}>
        {others.map((offer) => (
          <OfferRow key={offer.id} offer={offer} />
        ))}

        <View style={styles.codeRow}>
          <Ionicons name="ticket-outline" size={18} color={NAVY} />
          <TextInput
            value={draftCode}
            onChangeText={(text) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onChangeDraftCode(text);
            }}
            placeholder={t('cart.offersCodePlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!applyLoading}
            style={styles.codeInput}
            returnKeyType="done"
            onSubmitEditing={onApplyCode}
          />
          <Pressable
            onPress={onApplyCode}
            disabled={applyLoading || !draftCode.trim()}
            style={({ pressed }) => [
              styles.applyBtn,
              (applyLoading || !draftCode.trim()) && styles.applyBtnDisabled,
              pressed && !applyLoading && styles.pressed,
            ]}
          >
            {applyLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.applyBtnText}>{t('cart.offersApply')}</Text>
            )}
          </Pressable>
        </View>
        {applyError ? <Text style={styles.errorText}>{applyError}</Text> : null}
        {draftCode.trim().length > 0 && !applyLoading ? (
          <Pressable onPress={onClearCode} style={styles.clearLink}>
            <Text style={styles.clearLinkText}>{t('cart.offersClearCode')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const OfferRow = ({ offer }: { offer: CartOffer }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.offerRow}>
      <View
        style={[
          styles.offerIcon,
          offer.stackGroup === 'delivery' && styles.offerIconDelivery,
        ]}
      >
        <Ionicons
          name={offer.stackGroup === 'delivery' ? 'bicycle-outline' : 'pricetag-outline'}
          size={16}
          color={offer.applied ? GREEN : NAVY}
        />
      </View>
      <View style={styles.offerBody}>
        <View style={styles.offerTitleRow}>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          {offer.applied ? (
            <Text style={styles.offerApplied}>{t('cart.offersApplied')}</Text>
          ) : offer.stacksWithOthers ? (
            <Text style={styles.offerStacks}>{t('cart.offersStacks')}</Text>
          ) : null}
        </View>
        <Text style={styles.offerSub} numberOfLines={2}>
          {offer.subtitle}
        </Text>
        {!offer.eligible && offer.gapPaise > 0 ? (
          <Text style={styles.offerGap}>
            {t('cart.offersAddMore', { amount: formatInr(offer.gapPaise / 100) })}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'right',
  },
  featuredCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.md,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  featuredBadgeText: {
    fontSize: moderateScale(10, 0.35),
    fontWeight: '800',
    color: DIWALI_GRADIENT[1],
    textTransform: 'uppercase',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  appliedPillText: {
    fontSize: moderateScale(11, 0.35),
    fontWeight: '700',
    color: GREEN,
  },
  featuredTitle: {
    fontSize: moderateScale(18, 0.35),
    fontWeight: '800',
    color: colors.white,
  },
  featuredSub: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.92)',
  },
  codeChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  codeChipText: {
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.white,
    fontSize: moderateScale(12, 0.35),
  },
  featuredGap: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xxs,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  offerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerIconDelivery: {
    backgroundColor: '#E8F5E9',
  },
  offerBody: {
    flex: 1,
    minWidth: 0,
  },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  offerTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  offerApplied: {
    ...typography.caption,
    fontWeight: '700',
    color: GREEN,
  },
  offerStacks: {
    ...typography.caption,
    color: colors.textMuted,
  },
  offerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  offerGap: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '600',
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  codeInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  applyBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: moderateScale(72, 0.35),
    minHeight: moderateScale(36, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.55,
  },
  applyBtnText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  clearLink: {
    alignSelf: 'flex-start',
  },
  clearLinkText: {
    ...typography.caption,
    color: NAVY,
    fontWeight: '600',
  },
});

export default CartOffersSection;
