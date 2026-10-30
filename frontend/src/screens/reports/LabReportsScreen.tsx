import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { HealthReport } from '@/types/report';
import { deleteReport, fetchReports, uploadReport, type ReportUploadFile } from '@/services/reportService';
import { pickImageFromSource } from '@/utils/imagePicker';

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const imageFileFromUri = (uri: string): ReportUploadFile => {
  const isPng = uri.toLowerCase().includes('.png');
  return {
    uri,
    name: isPng ? 'report.png' : 'report.jpg',
    mimeType: isPng ? 'image/png' : 'image/jpeg',
  };
};

const LabReportsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();
  const [items, setItems] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoaded = React.useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else if (!hasLoaded.current) setLoading(true);
      try {
        const data = await fetchReports();
        setItems(data ?? []);
        hasLoaded.current = true;
      } catch (error: any) {
        Alert.alert(t('reports.couldNotLoad'), error?.message || t('reports.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const sendFile = async (file: ReportUploadFile) => {
    setUploading(true);
    try {
      const saved = await uploadReport(file);
      setItems((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    } catch (error: any) {
      Alert.alert(t('reports.uploadFailed'), error?.message || t('reports.couldNotUpload'));
    } finally {
      setUploading(false);
    }
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const image = await pickImageFromSource(
      source,
      source === 'camera' ? t('reports.permissionCamera') : t('reports.permissionPhotos'),
    );
    if (!image?.uri) return;
    await sendFile(imageFileFromUri(image.uri));
  };

  const openPicker = () => {
    if (uploading) return;
    Alert.alert(t('reports.pickTitle'), t('reports.pickHint'), [
      { text: t('reports.pickPhoto'), onPress: () => void pickPhoto('gallery') },
      { text: t('reports.pickCamera'), onPress: () => void pickPhoto('camera') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const confirmDelete = (item: HealthReport) => {
    Alert.alert(t('reports.deleteTitle'), t('reports.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingId(item.id);
            try {
              await deleteReport(item.id);
              setItems((prev) => prev.filter((row) => row.id !== item.id));
            } catch (error: any) {
              Alert.alert(t('reports.deleteFailed'), error?.message || t('reports.couldNotDelete'));
            } finally {
              setDeletingId(null);
            }
          })();
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.surfaceSecondary },
        hero: { paddingBottom: spacing.lg },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
        },
        iconBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        headerText: { flex: 1, alignItems: 'center' },
        headerTitle: { ...typography.h4, color: colors.white, fontWeight: '700' },
        headerSubtitle: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
        },
        body: {
          flex: 1,
          marginTop: -spacing.sm,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          overflow: 'hidden',
        },
        list: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          flexGrow: 1,
        },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...shadows.sm,
        },
        fileIcon: {
          width: 42,
          height: 42,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primaryMutedMedium,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardText: { flex: 1 },
        cardTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
        cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
        emptyWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
        },
        emptyTitle: { ...typography.h4, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.sm,
        },
        uploadCta: {
          marginTop: spacing.lg,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
        },
        uploadCtaText: { ...typography.button, color: colors.white, fontSize: 14 },
        pressed: { opacity: 0.85 },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const subtitle = uploading
    ? t('reports.uploading')
    : items.length
      ? t('reports.savedCount', { count: items.length })
      : t('reports.subtitleEmpty');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LinearGradient colors={gradients.settingsHero} style={styles.hero}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('reports.title')}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          <Pressable
            onPress={openPicker}
            disabled={uploading}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('reports.uploadA11y')}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add" size={22} color={colors.primary} />
            )}
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load('refresh')}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="image-outline" size={42} color={colors.primary} />
                <Text style={styles.emptyTitle}>{t('reports.empty')}</Text>
                <Text style={styles.emptySubtitle}>{t('reports.emptySubtitle')}</Text>
                <Pressable
                  onPress={openPicker}
                  style={({ pressed }) => [styles.uploadCta, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('reports.uploadA11y')}
                >
                  <Text style={styles.uploadCtaText}>{t('reports.upload')}</Text>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.fileIcon}>
                  <Ionicons name="image-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(item.createdAt)} · {t('reports.fileTypePhoto')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDelete(item)}
                  disabled={deletingId === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('reports.deleteA11y')}
                  hitSlop={8}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.error ?? colors.primary} />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                  )}
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default LabReportsScreen;
