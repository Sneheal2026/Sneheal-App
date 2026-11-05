import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const NAVY = '#111152';

export type OrderDeliverySupportVariant = 'active' | 'delivered';

type Props = {
  variant: OrderDeliverySupportVariant;
};

const OrderDeliverySupportCard = ({ variant }: Props) => {
  const { t } = useTranslation();
  const phoneDisplay = SUPPORT_CONTACT.phone;
  const phoneDial = SUPPORT_CONTACT.phone.replace(/\s/g, '');
  const email = SUPPORT_CONTACT.email;

  const openPhone = useCallback(() => {
    void Linking.openURL(`tel:${phoneDial}`);
  }, [phoneDial]);

  const openEmail = useCallback(() => {
    void Linking.openURL(`mailto:${email}`);
  }, [email]);

  const isActive = variant === 'active';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons
            name={isActive ? 'headset-outline' : 'chatbubbles-outline'}
            size={20}
            color={NAVY}
          />
        </View>
        <Text style={styles.title}>
          {isActive ? t('orders.supportActiveTitle') : t('orders.supportDeliveredTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {isActive ? t('orders.supportActiveSubtitle') : t('orders.supportDeliveredSubtitle')}
        </Text>

        {isActive ? (
          <Pressable
            onPress={openPhone}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('orders.supportCallA11y', { phone: phoneDisplay })}
          >
            <Ionicons name="call" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>{phoneDisplay}</Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={openPhone}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('orders.supportCallA11y', { phone: phoneDisplay })}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="call-outline" size={18} color={NAVY} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionLabel}>{t('orders.supportCallLabel')}</Text>
                <Text style={styles.actionValue}>{phoneDisplay}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={openEmail}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('orders.supportEmailA11y', { email })}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="mail-outline" size={18} color={NAVY} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionLabel}>{t('orders.supportEmailLabel')}</Text>
                <Text style={styles.actionValue} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    padding: spacing.lg,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NAVY,
    borderRadius: borderRadius.lg,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  actions: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#EEF1F6',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
  actionValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: NAVY,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8ECF2',
    marginHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default OrderDeliverySupportCard;
