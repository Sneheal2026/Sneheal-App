import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/common/ScreenHeader';
import theme from '@/styles/theme';
import type { TabScreenProps } from '@/navigation/types';

const { colors, spacing, typography, moderateScale, verticalScale } = theme;

const CART_EMPTY_PIC = require('../../../assets/images/Cart-Empty-Pic.webp');

const CartScreen = (_props: TabScreenProps<'Cart'>) => {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />

      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Image source={CART_EMPTY_PIC} style={styles.emptyImage} resizeMode="contain" />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: verticalScale(72),
  },
  emptyState: {
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(320, 0.35),
  },
  emptyImage: {
    width: moderateScale(280, 0.35),
    height: moderateScale(280, 0.35),
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CartScreen;
