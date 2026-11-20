import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import theme from '@/styles/theme';
import QuantityStepper from '@/components/common/QuantityStepper';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const ADD_GREEN_LIGHT = '#E8F7EE';

interface CartItemRowProps {
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit?: string;
  prescriptionRequired?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const CartItemRow = ({
  name,
  image,
  price,
  originalPrice,
  quantity,
  unit = '1 pack',
  prescriptionRequired,
  onIncrement,
  onDecrement,
}: CartItemRowProps) => {
  const lineTotal = price * quantity;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.info}>
        <View style={styles.nameHeaderRow}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.unit}>{unit}</Text>
          {prescriptionRequired ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{lineTotal.toFixed(2)}</Text>
          {originalPrice && originalPrice > price ? (
            <Text style={styles.mrp}>₹{(originalPrice * quantity).toFixed(2)}</Text>
          ) : null}
        </View>
      </View>

      <QuantityStepper
        quantity={quantity}
        onIncrement={onIncrement ?? (() => undefined)}
        onDecrement={onDecrement ?? (() => undefined)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imageWrap: {
    width: moderateScale(64, 0.35),
    height: moderateScale(64, 0.35),
    borderRadius: borderRadius.md,
    backgroundColor: ADD_GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rxBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rxBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  unit: {
    ...typography.caption,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  price: {
    fontSize: moderateScale(14, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mrp: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});

export default CartItemRow;
