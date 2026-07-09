import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Loader from '@/components/common/Loader';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import type { SavedAddress } from '@/types/location.types';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  work: 'briefcase',
  other: 'location',
};

const SavedAddressesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'SavedAddresses'>>();
  const { colors, spacing, typography, moderateScale, borderRadius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
        backButton: {
          width: moderateScale(38),
          height: moderateScale(38),
          borderRadius: moderateScale(19),
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          ...typography.h4,
          flex: 1,
          fontSize: moderateScale(18),
        },
        headerSpacer: {
          width: moderateScale(38),
        },
        listContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xxxl,
          gap: spacing.sm,
          flexGrow: 1,
        },
        errorBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: '#FFF5F5',
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: '#FED7D7',
        },
        errorText: {
          ...typography.caption,
          color: colors.error,
          flex: 1,
        },
        card: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          gap: spacing.md,
        },
        cardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
        },
        iconCircle: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        iconCircleSelected: {
          backgroundColor: colors.primary,
        },
        cardContent: {
          flex: 1,
          gap: spacing.xxs,
        },
        cardTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        typeLabel: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        defaultBadge: {
          backgroundColor: colors.successLight,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
        },
        defaultText: {
          ...typography.caption,
          fontSize: 10,
          fontWeight: '700',
          color: colors.success,
        },
        flatText: {
          ...typography.bodySmall,
          color: colors.textPrimary,
        },
        addressLine: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        receiverText: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: spacing.xxs,
        },
        cardActions: {
          gap: spacing.md,
          paddingTop: spacing.xxs,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingTop: spacing.xxxxxl + spacing.xxxl,
          gap: spacing.sm,
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.textPrimary,
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        bottomSafe: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        addButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md + 2,
          marginBottom: spacing.sm,
        },
        addButtonText: {
          ...typography.button,
          color: colors.textInverse,
        },
      }),
    [borderRadius, colors, moderateScale, spacing, typography],
  );

  const { addresses, selectedAddress, loading, error, refresh, selectAddress, removeAddress } =
    useSavedAddresses();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleSelect = useCallback(
    async (address: SavedAddress) => {
      if (selectingId) return;

      if (selectedAddress?.id === address.id) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      setSelectingId(address.id);
      try {
        await selectAddress(address.id);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch {
        Alert.alert('Error', 'Could not update delivery address. Please try again.');
      } finally {
        setSelectingId(null);
      }
    },
    [selectAddress, navigation, selectingId, selectedAddress?.id],
  );

  const handleEdit = useCallback(
    (address: SavedAddress) => {
      navigation.navigate('LocationMap', { editAddress: address, returnTo: 'SavedAddresses' });
    },
    [navigation],
  );

  const handleDelete = useCallback(
    (address: SavedAddress) => {
      const label = address.type === 'other'
        ? address.customTypeLabel || 'Other'
        : address.type.charAt(0).toUpperCase() + address.type.slice(1);

      Alert.alert(
        'Delete address',
        `Remove your "${label}" address?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(address.id);
              try {
                await removeAddress(address.id);
              } catch {
                Alert.alert('Error', 'Could not delete address. Please try again.');
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [removeAddress, deletingId],
  );

  const handleAddNew = useCallback(() => {
    navigation.navigate('LocationMap', { returnTo: 'SavedAddresses' });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: SavedAddress }) => {
      const isSelected = selectedAddress?.id === item.id;
      const isSelecting = selectingId === item.id;
      const isDeleting = deletingId === item.id;
      const typeLabel = item.type === 'other'
        ? item.customTypeLabel || 'Other'
        : item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const icon = TYPE_ICONS[item.type] ?? 'location';

      return (
        <TouchableOpacity
          style={[styles.card, isSelected && styles.cardSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
          disabled={Boolean(selectingId) || Boolean(deletingId)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${typeLabel} address`}
        >
          <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
            <Ionicons
              name={icon}
              size={moderateScale(18)}
              color={isSelected ? colors.white : colors.primary}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <Text style={styles.flatText} numberOfLines={1}>
              {item.flatNumber}
              {item.landmark ? `, ${item.landmark}` : ''}
            </Text>
            <Text style={styles.addressLine} numberOfLines={1}>
              {item.addressLine}
            </Text>
            <Text style={styles.receiverText}>
              {item.receiverName}  ·  {item.mobile}
            </Text>
          </View>

          <View style={styles.cardActions}>
            {isSelecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={Boolean(selectingId) || Boolean(deletingId)}
              accessibilityLabel="Edit address"
            >
              <Ionicons name="create-outline" size={moderateScale(18)} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={Boolean(selectingId) || isDeleting}
              accessibilityLabel="Delete address"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Ionicons name="trash-outline" size={moderateScale(18)} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedAddress, handleSelect, handleEdit, handleDelete, selectingId, deletingId, colors, styles],
  );

  if (loading && addresses.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={moderateScale(20)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved addresses</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Loader message="Loading your addresses..." fullScreen={false} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={moderateScale(20)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved addresses</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={moderateScale(16)} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="location-outline"
                size={moderateScale(52)}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptySubtitle}>
                Add a delivery address to get started
              </Text>
            </View>
          )
        }
      />

      {/* ── Add new address button ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNew}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add a new address"
        >
          <Ionicons name="add" size={moderateScale(20)} color={colors.white} />
          <Text style={styles.addButtonText}>Add new address</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

export default SavedAddressesScreen;
