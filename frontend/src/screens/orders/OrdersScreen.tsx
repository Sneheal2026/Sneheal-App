import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography, borderRadius, shadows } = theme;

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
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const handleTrackDemo = useCallback(() => {
    // Must match agent orderId in DeliveryAgentHomeScreen (Firebase path key)
    navigation.navigate('CustomerTracking', {
      orderId: '#SNH-4821',
      customerCoords: { latitude: 18.6725, longitude: 78.0941 },
      customerAddress: 'Nizamabad Bus Stop, Nizamabad, Telangana',
    });
  }, [navigation]);

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <DotPattern />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyText}>No orders placed yet</Text>

        {/* Temporary test button — remove when real orders are wired */}
        <Pressable onPress={handleTrackDemo} style={styles.trackDemoBtn}>
          <Ionicons name="bicycle" size={18} color="#fff" />
          <Text style={styles.trackDemoBtnText}>Track Demo Order</Text>
        </Pressable>
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
  trackDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  trackDemoBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
});

export default OrdersScreen;
