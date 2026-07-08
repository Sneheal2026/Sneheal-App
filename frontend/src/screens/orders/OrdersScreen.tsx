import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import ScreenHeader from '@/components/common/ScreenHeader';
import theme from '@/styles/theme';
import type { TabScreenProps } from '@/navigation/types';

const { colors, spacing, typography, moderateScale, verticalScale } = theme;

const NO_ORDERS_PIC = require('../../../assets/images/No-Orders-Pic.webp');

const OrdersScreen = (_props: TabScreenProps<'Orders'>) => {
  return (
    <View style={styles.root}>
      <ScreenHeader title="My Orders" subtitle="Track and manage your orders" />

      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Image source={NO_ORDERS_PIC} style={styles.emptyImage} resizeMode="contain" />
          <Text style={styles.emptyText}>No orders placed yet</Text>
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

export default OrdersScreen;
