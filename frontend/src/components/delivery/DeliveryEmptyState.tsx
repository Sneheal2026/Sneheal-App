import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';

const { spacing, typography, borderRadius } = theme;

interface DeliveryEmptyStateProps {
  isOnline: boolean;
}

const DeliveryEmptyState: React.FC<DeliveryEmptyStateProps> = ({ isOnline }) => (
  <View style={styles.wrap}>
    <View style={styles.iconWrap}>
      <Ionicons name="cube-outline" size={32} color={deliveryTheme.accent} />
    </View>
    <Text style={styles.title}>No active orders</Text>
    <Text style={styles.text}>
      {isOnline
        ? 'New delivery requests will appear here when assigned.'
        : 'Go online to start receiving delivery requests.'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: deliveryTheme.surface,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});

export default DeliveryEmptyState;
