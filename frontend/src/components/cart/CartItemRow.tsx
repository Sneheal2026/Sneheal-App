import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const ADD_GREEN = '#1F9D55';
const ADD_GREEN_LIGHT = '#E8F7EE';

interface CartItemRowProps {
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit?: string;
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
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.unit}>{unit}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${lineTotal.toFixed(2)}</Text>
          {originalPrice && originalPrice > price ? (
            <Text style={styles.mrp}>${(originalPrice * quantity).toFixed(2)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.stepper}>
        <Pressable
          onPress={onDecrement}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
          hitSlop={6}
        >
          <Ionicons name="remove" size={15} color={ADD_GREEN} />
        </Pressable>
        <Text style={styles.qty}>{quantity}</Text>
        <Pressable
          onPress={onIncrement}
          style={({ pressed }) => [
            styles.stepBtn,
            styles.stepBtnAdd,
            pressed && styles.stepBtnAddPressed,
          ]}
          hitSlop={6}
        >
          <Ionicons name="add" size={15} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    paddingTop: 2,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: ADD_GREEN,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepBtnPressed: {
    backgroundColor: ADD_GREEN_LIGHT,
  },
  stepBtnAdd: {
    backgroundColor: ADD_GREEN,
  },
  stepBtnAddPressed: {
    backgroundColor: '#188A47',
  },
  qty: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: moderateScale(13, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default CartItemRow;
