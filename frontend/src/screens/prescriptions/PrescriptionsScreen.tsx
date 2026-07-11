import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AuthStackParamList } from '@/navigation/types';
import type { SavedPrescription } from '@/types/prescription';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchPrescriptions,
  deletePrescription,
  getCachedPrescriptions,
} from '@/services/prescriptionService';
import Shimmer from '@/components/common/Shimmer';
import ShimmerImage from '@/components/common/ShimmerImage';

const PrescriptionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { width } = useWindowDimensions();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();

  const cached = getCachedPrescriptions();
  const [items, setItems] = useState<SavedPrescription[]>(cached ?? []);
  const [loading, setLoading] = useState(cached == null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const gap = spacing.md;
  const horizontalPad = spacing.xl;
  const cardWidth = (width - horizontalPad * 2 - gap) / 2;

  const loadPrescriptions = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;
    const hasLocal = (getCachedPrescriptions()?.length ?? items.length) > 0 || items.length > 0;

    if (force) setRefreshing(true);
    else if (!hasLocal) setLoading(true);

    try {
      const data = await fetchPrescriptions({ force });
      if (requestId !== requestIdRef.current) return;
      setItems(data ?? []);
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      if (!hasLocal) {
        Alert.alert('Could not load', error?.message || 'Failed to load prescriptions');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [items.length]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestId = ++requestIdRef.current;

      const run = async () => {
        const warm = getCachedPrescriptions();
        if (warm) {
          setItems(warm);
          setLoading(false);
        }

        // Cache-first: network only when empty/stale (handled inside fetchPrescriptions)
        try {
          const data = await fetchPrescriptions({ force: false });
          if (!active || requestId !== requestIdRef.current) return;
          setItems(data ?? []);
        } catch (error: any) {
          if (!active || requestId !== requestIdRef.current) return;
          if (!getCachedPrescriptions()?.length) {
            Alert.alert('Could not load', error?.message || 'Failed to load prescriptions');
          }
        } finally {
          if (active && requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      };

      void run();

      return () => {
        active = false;
        requestIdRef.current += 1; // ignore in-flight results after blur/unmount
      };
    }, []),
  );

  const handleUpload = () => {
    navigation.navigate('MedicineScan');
  };

  const handleDelete = (item: SavedPrescription) => {
    Alert.alert('Delete prescription?', 'This removes the saved photo from your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const requestId = requestIdRef.current;
            setDeletingId(item.id);
            try {
              await deletePrescription(item.id);
              if (requestId !== requestIdRef.current) return;
              setItems((prev) => prev.filter((p) => p.id !== item.id));
            } catch (error: any) {
              if (requestId !== requestIdRef.current) return;
              Alert.alert('Delete failed', error?.message || 'Could not delete');
            } finally {
              if (requestId === requestIdRef.current) {
                setDeletingId(null);
              }
            }
          })();
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        hero: {
          paddingBottom: spacing.lg,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
        },
        backBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        backBtnPressed: { opacity: 0.8 },
        headerTextBlock: {
          flex: 1,
          alignItems: 'center',
        },
        headerTitle: {
          ...typography.h4,
          color: colors.white,
          fontWeight: '700',
        },
        headerSubtitle: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
        },
        addBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        body: {
          flex: 1,
          marginTop: -spacing.sm,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          overflow: 'hidden',
        },
        listContent: {
          paddingHorizontal: horizontalPad,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxxxl,
          gap,
        },
        columnWrapper: {
          gap,
        },
        card: {
          width: cardWidth,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.white,
          ...shadows.sm,
        },
        cardImage: {
          width: '100%',
          height: cardWidth * 1.25,
          backgroundColor: colors.surfaceSecondary,
        },
        skeletonGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: horizontalPad,
          paddingTop: spacing.xl,
          gap,
        },
        skeletonCard: {
          width: cardWidth,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.white,
          ...shadows.sm,
        },
        skeletonFooter: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          gap: spacing.xs,
        },
        cardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
        },
        cardDate: {
          ...typography.caption,
          color: colors.textSecondary,
          flex: 1,
        },
        deleteBtn: {
          width: moderateScale(32),
          height: moderateScale(32),
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.errorLight ?? 'rgba(239,68,68,0.12)',
        },
        emptyWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxxl,
        },
        emptyIconCircle: {
          width: moderateScale(88),
          height: moderateScale(88),
          borderRadius: moderateScale(44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        emptyTitle: {
          ...typography.h3,
          color: colors.textPrimary,
          fontWeight: '700',
          textAlign: 'center',
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
        },
        uploadCta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md + 4,
          paddingHorizontal: spacing.xl,
          marginTop: spacing.sm,
          minHeight: moderateScale(52),
        },
        uploadCtaPressed: { opacity: 0.9 },
        uploadCtaText: {
          ...typography.button,
          color: colors.white,
        },
      }),
    [
      borderRadius,
      cardWidth,
      colors,
      gap,
      horizontalPad,
      moderateScale,
      shadows,
      spacing,
      typography,
    ],
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.35, 1]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Prescriptions</Text>
              <Text style={styles.headerSubtitle}>
                {items.length > 0 ? `${items.length} saved` : 'Your uploaded photos'}
              </Text>
            </View>
            <Pressable
              onPress={handleUpload}
              style={({ pressed }) => [styles.addBtn, pressed && styles.backBtnPressed]}
              accessibilityLabel="Upload prescription"
            >
              <Ionicons name="add" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.skeletonGrid}>
            {[0, 1].map((key) => (
              <View key={key} style={styles.skeletonCard}>
                <Shimmer
                  width="100%"
                  height={cardWidth * 1.25}
                  borderRadius={0}
                />
                <View style={styles.skeletonFooter}>
                  <Shimmer width="70%" height={12} borderRadius={6} />
                </View>
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
            <LinearGradient
              colors={[colors.infoLight, colors.white]}
              style={styles.emptyIconCircle}
            >
              <Ionicons
                name="document-text-outline"
                size={moderateScale(40)}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan and save a prescription photo to keep it here for later.
            </Text>
            <Pressable
              onPress={handleUpload}
              style={({ pressed }) => [styles.uploadCta, pressed && styles.uploadCtaPressed]}
              accessibilityLabel="Upload prescription"
            >
              <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
              <Text style={styles.uploadCtaText}>Upload prescription</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadPrescriptions(true)}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <ShimmerImage
                  uri={item.imageUrl}
                  style={styles.cardImage}
                  borderRadius={0}
                  recyclingKey={item.id}
                />
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate} numberOfLines={1}>
                    {formatDate(item.createdAt)}
                  </Text>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    style={styles.deleteBtn}
                    accessibilityLabel="Delete prescription"
                  >
                    {deletingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default PrescriptionsScreen;
