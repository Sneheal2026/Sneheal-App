import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeOut,
  ZoomIn,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme from '@/styles/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_PRESS = { damping: 18, stiffness: 420, mass: 0.6 };
const SPRING_LAYOUT = { damping: 22, stiffness: 320, mass: 0.8 };

const { colors, moderateScale } = theme;

const ADD_GREEN = '#1F9D55';
const ADD_GREEN_LIGHT = '#E8F7EE';
const ADD_GREEN_DARK = '#188A47';

const SIZE = {
  sm: {
    addBtn: moderateScale(34, 0.35),
    slot: moderateScale(92, 0.35),
    inner: moderateScale(28, 0.35),
    iconAdd: moderateScale(19, 0.35),
    iconStep: moderateScale(14, 0.35),
    qtyFont: moderateScale(13, 0.35),
    qtyLine: moderateScale(16, 0.35),
    pad: moderateScale(3, 0.35),
  },
  lg: {
    addBtn: moderateScale(48, 0.35),
    slot: moderateScale(140, 0.35),
    inner: moderateScale(40, 0.35),
    iconAdd: moderateScale(26, 0.35),
    iconStep: moderateScale(18, 0.35),
    qtyFont: moderateScale(16, 0.35),
    qtyLine: moderateScale(20, 0.35),
    pad: moderateScale(4, 0.35),
  },
} as const;

type StepperSize = keyof typeof SIZE;

interface ScalePressableProps {
  onPress: () => void;
  style?: object | object[];
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  children: React.ReactNode;
}

const ScalePressable = ({ onPress, style, hitSlop, children }: ScalePressableProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
      hitSlop={hitSlop}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** `sm` for product cards / cart rows. `lg` for the product details footer. */
  size?: StepperSize;
  /** Keep a fixed width so card layouts do not jump. Footer should turn this off. */
  reserveSlot?: boolean;
}

const QuantityStepper = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'sm',
  reserveSlot = true,
}: QuantityStepperProps) => {
  const dim = SIZE[size];

  const slotStyle = useMemo(
    () => ({
      width: reserveSlot || quantity > 0 ? dim.slot : dim.addBtn,
      height: dim.addBtn,
    }),
    [dim, quantity, reserveSlot],
  );

  return (
    <Animated.View
      layout={LinearTransition.springify()
        .damping(SPRING_LAYOUT.damping)
        .stiffness(SPRING_LAYOUT.stiffness)
        .mass(SPRING_LAYOUT.mass)}
      style={[
        styles.actionSlot,
        slotStyle,
        size === 'sm' && styles.cardElevation,
      ]}
    >
      {quantity === 0 ? (
        <Animated.View
          entering={ZoomIn.springify().damping(20).stiffness(340)}
          exiting={FadeOut.duration(140)}
          style={{ width: dim.addBtn, height: dim.addBtn }}
        >
          <ScalePressable
            onPress={onIncrement}
            style={[
              styles.addBtn,
              {
                width: dim.addBtn,
                height: dim.addBtn,
                borderRadius: dim.addBtn / 2,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={dim.iconAdd} color={colors.white} />
          </ScalePressable>
        </Animated.View>
      ) : (
        <Animated.View
          entering={ZoomIn.springify().damping(20).stiffness(340)}
          exiting={FadeOut.duration(140)}
          style={[
            styles.qtyCounter,
            {
              width: dim.slot,
              height: dim.addBtn,
              borderRadius: dim.addBtn / 2,
              paddingHorizontal: dim.pad,
            },
          ]}
        >
          <ScalePressable
            onPress={onDecrement}
            style={[
              styles.qtyBtnMinus,
              {
                width: dim.inner,
                height: dim.inner,
                borderRadius: dim.inner / 2,
              },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="remove" size={dim.iconStep} color={ADD_GREEN} />
          </ScalePressable>

          <View style={[styles.qtyValueWrap, { height: dim.inner }]}>
            <Animated.Text
              key={quantity}
              entering={ZoomIn.springify().damping(22).stiffness(380)}
              style={[
                styles.qtyText,
                {
                  fontSize: dim.qtyFont,
                  lineHeight: dim.qtyLine,
                },
              ]}
            >
              {quantity}
            </Animated.Text>
          </View>

          <ScalePressable
            onPress={onIncrement}
            style={[
              styles.qtyBtnPlus,
              {
                width: dim.inner,
                height: dim.inner,
                borderRadius: dim.inner / 2,
              },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={dim.iconStep} color={colors.white} />
          </ScalePressable>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardElevation: {
    zIndex: 20,
    elevation: 20,
  },
  addBtn: {
    backgroundColor: ADD_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ADD_GREEN,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  qtyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ADD_GREEN_LIGHT,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.15)',
  },
  qtyBtnMinus: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  qtyBtnPlus: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADD_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: ADD_GREEN_DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  qtyValueWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    textAlign: 'center',
    fontWeight: '800',
    color: ADD_GREEN_DARK,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});

export default QuantityStepper;
