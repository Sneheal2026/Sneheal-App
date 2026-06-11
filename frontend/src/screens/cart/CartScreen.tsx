import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';
import type { TabScreenProps } from '@/navigation/types';

const { colors, spacing, typography, borderRadius, moderateScale } = theme;

const ADD_GREEN = '#1F9D55';

const DUMMY_CART_ITEMS = [
  {
    id: '1',
    name: 'Daily Multivitamin Capsules',
    image: require('../../../assets/images/Vitamins-Minerals.png'),
    price: 12.49,
    quantity: 2,
  },
  {
    id: '2',
    name: 'Pediacare Super Immune Plus',
    image: require('../../../assets/images/Nutrition-Drinks.png'),
    price: 15.99,
    quantity: 1,
  },
  {
    id: '4',
    name: 'Pain Relief Tablets',
    image: require('../../../assets/images/Pain-Relief.png'),
    price: 4.99,
    quantity: 3,
  },
];

const SUBTOTAL = DUMMY_CART_ITEMS.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0,
);

const CartScreen = (_props: TabScreenProps<'Cart'>) => {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <Text style={styles.subtitle}>3 items in your basket</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {DUMMY_CART_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemImageWrap}>
              <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
            </View>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.qtyCounter}>
              <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.7}>
                <Ionicons name="remove" size={16} color={ADD_GREEN} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${SUBTOTAL.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, styles.freeDelivery]}>FREE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${SUBTOTAL.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.perksCard}>
          <View style={styles.perkRow}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.perkText}>Genuine medicines guaranteed</Text>
          </View>
          <View style={styles.perkRow}>
            <Ionicons name="flash" size={16} color={colors.warning} />
            <Text style={styles.perkText}>Delivery in 30–45 mins</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.checkoutBar}>
        <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.85}>
          <Text style={styles.checkoutText}>Proceed to checkout</Text>
          <Text style={styles.checkoutPrice}>${SUBTOTAL.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  itemImageWrap: {
    width: moderateScale(56, 0.35),
    height: moderateScale(56, 0.35),
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  itemName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemPrice: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  qtyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: ADD_GREEN,
    flexShrink: 0,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  qtyBtnAdd: {
    backgroundColor: ADD_GREEN,
  },
  qtyText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: moderateScale(13, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  freeDelivery: {
    color: colors.success,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  perksCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkoutBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ADD_GREEN,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  checkoutText: {
    ...typography.button,
    color: colors.white,
  },
  checkoutPrice: {
    ...typography.button,
    color: colors.white,
  },
});

export default CartScreen;
