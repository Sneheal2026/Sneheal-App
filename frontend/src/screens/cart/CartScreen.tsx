import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import { CartBilling, CartItemRow } from '@/components/cart';
import type { BillLine } from '@/components/cart';
import type { TabScreenProps } from '@/navigation/types';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const PAGE_BG = '#F5F6F8';
const BLINKIT_GREEN = '#0C831F';
const DELIVERY_FEE = 2.99;

const DUMMY_CART_ITEMS = [
  {
    id: '1',
    name: 'Daily Multivitamin Capsules',
    image: require('../../../assets/images/Vitamins-Minerals.png'),
    price: 12.49,
    originalPrice: 16.65,
    quantity: 2,
    unit: '60 capsules',
  },
  {
    id: '2',
    name: 'Pediacare Super Immune Plus',
    image: require('../../../assets/images/Nutrition-Drinks.png'),
    price: 15.99,
    originalPrice: 18.15,
    quantity: 1,
    unit: '400 ml',
  },
  {
    id: '4',
    name: 'Pain Relief Tablets',
    image: require('../../../assets/images/Pain-Relief.png'),
    price: 4.99,
    originalPrice: 6.99,
    quantity: 3,
    unit: '10 tablets',
  },
];

const CartScreen = (_props: TabScreenProps<'Cart'>) => {
  const insets = useSafeAreaInsets();

  const itemCount = DUMMY_CART_ITEMS.reduce((sum, item) => sum + item.quantity, 0);

  const { itemTotal, mrpTotal, savings, grandTotal } = useMemo(() => {
    const itemTotal = DUMMY_CART_ITEMS.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const mrpTotal = DUMMY_CART_ITEMS.reduce(
      (sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity,
      0,
    );
    const productSavings = mrpTotal - itemTotal;
    const deliverySavings = DELIVERY_FEE;
    const savings = productSavings + deliverySavings;
    const grandTotal = itemTotal;

    return { itemTotal, mrpTotal, savings, grandTotal };
  }, []);

  const billLines: BillLine[] = [
    {
      label: 'Item total',
      value: `$${itemTotal.toFixed(2)}`,
      strikethrough: mrpTotal > itemTotal ? `$${mrpTotal.toFixed(2)}` : undefined,
    },
    {
      label: 'Delivery charge',
      value: 'FREE',
      strikethrough: `$${DELIVERY_FEE.toFixed(2)}`,
      free: true,
    },
    {
      label: 'Handling charge',
      value: 'FREE',
      strikethrough: '$1.00',
      free: true,
    },
    {
      label: 'Small cart fee',
      value: '$0.00',
    },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Cart</Text>
            <Text style={styles.subtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · Review before checkout
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{itemCount}</Text>
          </View>
        </View>

        <View style={styles.deliveryStrip}>
          <View style={styles.deliveryIcon}>
            <Ionicons name="flash" size={14} color={BLINKIT_GREEN} />
          </View>
          <View style={styles.deliveryTextBlock}>
            <Text style={styles.deliveryTitle}>Delivery in 30–45 mins</Text>
            <Text style={styles.deliverySub}>Shipment of {DUMMY_CART_ITEMS.length} items</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: moderateScale(100, 0.35) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsSection}>
          <Text style={styles.sectionLabel}>Items in your cart</Text>
          <View style={styles.itemsList}>
            {DUMMY_CART_ITEMS.map((item) => (
              <CartItemRow
                key={item.id}
                name={item.name}
                image={item.image}
                price={item.price}
                originalPrice={item.originalPrice}
                quantity={item.quantity}
                unit={item.unit}
              />
            ))}
          </View>
        </View>

        <View style={styles.couponRow}>
          <View style={styles.couponLeft}>
            <Ionicons name="ticket-outline" size={18} color={BLINKIT_GREEN} />
            <Text style={styles.couponText}>Apply coupon</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        <CartBilling
          lines={billLines}
          savings={savings}
          grandTotal={grandTotal}
        />

        <View style={styles.trustRow}>
          <View style={styles.trustChip}>
            <Ionicons name="shield-checkmark" size={14} color={BLINKIT_GREEN} />
            <Text style={styles.trustText}>Genuine medicines</Text>
          </View>
          <View style={styles.trustChip}>
            <Ionicons name="snow-outline" size={14} color={colors.primary} />
            <Text style={styles.trustText}>Cold-chain safe</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.checkoutLeft}>
          <Text style={styles.checkoutTotal}>${grandTotal.toFixed(2)}</Text>
          <Text style={styles.checkoutSub}>TOTAL</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.placeOrderBtn, pressed && styles.placeOrderPressed]}
        >
          <LinearGradient
            colors={[BLINKIT_GREEN, '#0A6B1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.placeOrderGradient}
          >
            <Text style={styles.placeOrderText}>Place order</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  safeTop: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: moderateScale(22, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    width: moderateScale(36, 0.35),
    height: moderateScale(36, 0.35),
    borderRadius: borderRadius.full,
    backgroundColor: PAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: moderateScale(14, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  deliveryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: PAGE_BG,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  deliveryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E7F5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryTextBlock: {
    flex: 1,
    gap: 1,
  },
  deliveryTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deliverySub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  itemsSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xxs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  couponText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  trustChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  trustText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
    ...shadows.lg,
    shadowOffset: { width: 0, height: -3 },
  },
  checkoutLeft: {
    gap: 1,
  },
  checkoutTotal: {
    fontSize: moderateScale(20, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  checkoutSub: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  placeOrderBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  placeOrderPressed: {
    opacity: 0.92,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.md + 2 : spacing.md,
    paddingHorizontal: spacing.xl,
  },
  placeOrderText: {
    ...typography.button,
    color: colors.white,
  },
});

export default CartScreen;
