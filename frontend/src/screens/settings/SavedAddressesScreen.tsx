import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDeliveryAddress, clearDeliveryAddress } from '@/services/addressStorage';
import type { DeliveryAddress, AddressLabel } from '@/types/address';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const LABEL_CONFIG: Record<AddressLabel, { text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  home: { text: 'Home', icon: 'home' },
  work: { text: 'Work', icon: 'briefcase' },
  other: { text: 'Other', icon: 'location' },
};

const SavedAddressesScreen = () => {
  const navigation = useNavigation();
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAddress = useCallback(async () => {
    setLoading(true);
    const saved = await getDeliveryAddress();
    setAddress(saved);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddress();
    }, [loadAddress]),
  );

  const handleAddOrEdit = () => {
    navigation.navigate('SelectLocation' as never);
  };

  const handleDelete = () => {
    if (!address) return;

    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this saved address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearDeliveryAddress();
            setAddress(null);
          },
        },
      ],
    );
  };

  const areaName = address?.areaName || address?.locality || 'Saved address';
  const labelInfo = address ? LABEL_CONFIG[address.label] : null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Saved addresses</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!loading && !address && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No saved address yet</Text>
            <Text style={styles.emptyText}>
              Add your delivery address so medicines reach you on time.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              onPress={handleAddOrEdit}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Add address</Text>
            </Pressable>
          </View>
        )}

        {address && (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.labelChip}>
                <Ionicons name={labelInfo?.icon ?? 'home'} size={14} color={colors.primary} />
                <Text style={styles.labelChipText}>{labelInfo?.text ?? 'Home'}</Text>
              </View>
              <Pressable onPress={handleDelete} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>

            <Text style={styles.areaName}>{areaName}</Text>
            <Text style={styles.fullAddress}>{address.formattedAddress}</Text>

            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{address.flatHouse}</Text>
            </View>

            {address.landmark ? (
              <View style={styles.detailRow}>
                <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{address.landmark}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{address.receiverName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>+91 {address.phone}</Text>
            </View>

            {address.postalCode ? (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>PIN {address.postalCode}</Text>
              </View>
            ) : null}
          </View>
        )}

        {address && (
          <Pressable
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            onPress={handleAddOrEdit}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Change address</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  safeTop: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.h3,
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxxxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  emptyTitle: {
    ...typography.h3,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    ...typography.button,
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  labelChipText: {
    ...typography.caption,
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.primary,
  },
  areaName: {
    ...typography.h3,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fullAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default SavedAddressesScreen;
