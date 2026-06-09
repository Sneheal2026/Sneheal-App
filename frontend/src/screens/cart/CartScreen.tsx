import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import MedicineLoader from '@/components/common/MedicineLoader';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';
import type { TabScreenProps } from '@/navigation/types';

const { colors, spacing, typography, borderRadius } = theme;

const CartScreen = ({ navigation }: TabScreenProps<'Cart'>) => {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);

  // Simulate an API fetch every time the Cart tab is opened
  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <Text style={styles.subtitle}>Your basket is waiting</Text>
      </View>

      {/* Empty State */}
      <View style={styles.emptyState}>
        <View style={styles.iconBubble}>
          <Ionicons name="cart-outline" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Looks like you haven&apos;t added anything yet.{'\n'}
          Browse our fresh collection and fill your basket!
        </Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation?.navigate('Search')}
          accessibilityLabel="Start Shopping"
          accessibilityRole="button"
        >
          <Ionicons name="search" size={18} color={colors.white} />
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card (decorative) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <Text style={styles.summaryText}>Free delivery on orders above ₹499</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="flash" size={18} color={colors.warning} />
          <Text style={styles.summaryText}>Same-day delivery available</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="leaf" size={18} color={colors.primary} />
          <Text style={styles.summaryText}>100% organic & farm-fresh</Text>
        </View>
      </View>

      {/* Loader overlay – shows during simulated API fetch */}
      {loading && <MedicineLoader message="Fetching your cart…" />}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxxl,
  },
  iconBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  shopBtnText: {
    ...typography.button,
    color: colors.white,
  },
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

export default CartScreen;
