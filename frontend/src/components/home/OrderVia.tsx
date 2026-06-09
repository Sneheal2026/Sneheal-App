import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;

interface OrderOption {
  id: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const ORDER_OPTIONS: OrderOption[] = [
  { id: '1', label: 'WhatsApp', iconName: 'chatbubble-ellipses', iconColor: '#25D366' },
  { id: '2', label: 'Prescription', iconName: 'camera', iconColor: colors.accentPurple },
  { id: '3', label: 'Call', iconName: 'call', iconColor: colors.accentTeal },
];

const OrderVia = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLine} />
        <Text style={styles.sectionTitle}>OR YOU CAN ORDER VIA</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Buttons Row */}
      <View style={styles.buttonsRow}>
        {ORDER_OPTIONS.map((option) => (
          <TouchableOpacity key={option.id} style={styles.optionBtn} activeOpacity={0.7}>
            <Ionicons name={option.iconName} size={20} color={option.iconColor} />
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginHorizontal: spacing.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.orderBtnBorder,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionLabel: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});

export default OrderVia;
