import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Shimmer from '@/components/common/Shimmer';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/styles/theme';

const { spacing, moderateScale, borderRadius, shadows, colors } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_COLUMNS = 2;
const DEFAULT_COUNT = 6;
const DEFAULT_GAP = spacing.sm;
const DEFAULT_HORIZONTAL_PADDING = spacing.lg;

type ProductGridSkeletonProps = {
  count?: number;
  columns?: number;
  gap?: number;
  horizontalPadding?: number;
};

const ProductSkeletonCard = ({ width }: { width: number }) => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.imageBox}>
        <Shimmer width="62%" height="62%" borderRadius={moderateScale(10)} />
      </View>
      <View style={styles.body}>
        <View style={[styles.line, styles.lineTitle, { backgroundColor: themeColors.surfaceSecondary }]} />
        <View style={[styles.line, styles.lineSub, { backgroundColor: themeColors.surfaceSecondary }]} />
        <View style={styles.footer}>
          <View style={[styles.line, styles.linePrice, { backgroundColor: themeColors.surfaceSecondary }]} />
          <View
            style={[styles.stepper, { backgroundColor: themeColors.surfaceSecondary }]}
          />
        </View>
      </View>
    </View>
  );
};

const ProductGridSkeleton = ({
  count = DEFAULT_COUNT,
  columns = DEFAULT_COLUMNS,
  gap = DEFAULT_GAP,
  horizontalPadding = DEFAULT_HORIZONTAL_PADDING,
}: ProductGridSkeletonProps) => {
  const cardWidth = useMemo(() => {
    const gridWidth = SCREEN_WIDTH - horizontalPadding * 2;
    return (gridWidth - gap * (columns - 1)) / columns;
  }, [columns, gap, horizontalPadding]);

  const rows = useMemo(() => {
    const items = Array.from({ length: count }, (_, i) => i);
    const result: number[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [count, columns]);

  return (
    <View style={styles.grid} accessibilityLabel="Loading products">
      {rows.map((row, rowIndex) => (
        <Animated.View
          key={row.join('-')}
          entering={FadeInDown.delay(rowIndex * 55).duration(380).springify().damping(22)}
          style={[styles.row, { gap, marginBottom: gap }]}
        >
          {row.map((cellIndex) => (
            <ProductSkeletonCard key={cellIndex} width={cardWidth} />
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`spacer-${i}`} style={{ width: cardWidth }} />
              ))
            : null}
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.sm,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FB',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs + 2,
  },
  line: {
    borderRadius: borderRadius.full,
  },
  lineTitle: {
    height: moderateScale(11),
    width: '92%',
  },
  lineSub: {
    height: moderateScale(9),
    width: '58%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  linePrice: {
    height: moderateScale(14),
    width: '38%',
  },
  stepper: {
    width: moderateScale(72),
    height: moderateScale(28),
    borderRadius: borderRadius.full,
  },
});

export default React.memo(ProductGridSkeleton);
