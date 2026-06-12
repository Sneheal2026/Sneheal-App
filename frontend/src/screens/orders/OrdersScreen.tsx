import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography } = theme;

const DOT_ROWS = 12;
const DOT_COLS = 8;
const DOT_SIZE = 4;
const DOT_GAP = 28;

const DotPattern = () => (
  <View style={styles.pattern} pointerEvents="none">
    {Array.from({ length: DOT_ROWS }).map((_, row) => (
      <View key={row} style={styles.dotRow}>
        {Array.from({ length: DOT_COLS }).map((__, col) => (
          <View
            key={col}
            style={[
              styles.dot,
              (row + col) % 2 === 0 && styles.dotAlt,
            ]}
          />
        ))}
      </View>
    ))}
  </View>
);

const OrdersScreen = () => {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <DotPattern />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyText}>No orders placed yet</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pattern: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  dotRow: {
    flexDirection: 'row',
    marginBottom: DOT_GAP - DOT_SIZE,
    gap: DOT_GAP - DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.border,
  },
  dotAlt: {
    backgroundColor: colors.secondary + '30',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OrdersScreen;
