import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import {
  loadDevStorageDump,
  type StorageSection,
} from '@/utils/devStorageDump';
import { isDevStorageToolsEnabled } from '@/utils/devStorageReset';

const DevStorageInspectorScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();
  const [sections, setSections] = useState<StorageSection[]>([]);
  const [totalKeys, setTotalKeys] = useState(0);
  const [loadedAt, setLoadedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDump = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const dump = await loadDevStorageDump();
      setSections(dump.sections);
      setTotalKeys(dump.totalKeys);
      setLoadedAt(dump.loadedAt);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isDevStorageToolsEnabled()) {
        navigation.goBack();
        return;
      }
      void loadDump();
    }, [loadDump, navigation]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        hero: {
          paddingBottom: spacing.xl,
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
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        headerTitleWrap: {
          flex: 1,
          marginHorizontal: spacing.md,
        },
        headerTitle: {
          ...typography.h4,
          fontSize: moderateScale(18),
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 2,
        },
        refreshBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        pressed: {
          opacity: 0.75,
        },
        metaCard: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.lg,
          padding: spacing.lg,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.primaryBorder,
          ...shadows.sm,
        },
        metaTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        metaLine: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxxxl,
          gap: spacing.lg,
        },
        section: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...shadows.sm,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.primarySurface,
          borderBottomWidth: 1,
          borderBottomColor: colors.primaryBorder,
        },
        sectionTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.primaryDark,
          flex: 1,
        },
        sectionCount: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.primary,
        },
        field: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        fieldLast: {
          borderBottomWidth: 0,
        },
        fieldLabel: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: 2,
        },
        fieldKey: {
          ...typography.caption,
          fontSize: moderateScale(11),
          color: colors.textMuted,
          marginBottom: spacing.sm,
        },
        fieldValue: {
          ...typography.caption,
          fontFamily: 'monospace',
          color: colors.textSecondary,
          lineHeight: moderateScale(18),
        },
        emptyValue: {
          fontStyle: 'italic',
          color: colors.textMuted,
        },
        maskedBadge: {
          alignSelf: 'flex-start',
          marginBottom: spacing.xs,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
          backgroundColor: `${colors.warning}22`,
        },
        maskedBadgeText: {
          ...typography.caption,
          fontSize: moderateScale(10),
          fontWeight: '700',
          color: colors.warning,
        },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xxl,
        },
        emptyState: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const storedCountInSection = (section: StorageSection) =>
    section.fields.filter((field) => !field.isEmpty).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.35, 1]}
        style={styles.hero}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Dev Storage</Text>
            <Text style={styles.headerSubtitle}>AsyncStorage dump</Text>
          </View>
          <Pressable
            onPress={() => void loadDump(true)}
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Refresh storage dump"
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Local storage inspector</Text>
          <Text style={styles.metaLine}>
            {totalKeys} key{totalKeys === 1 ? '' : 's'} · Updated {loadedAt || '—'}
          </Text>
          <Text style={styles.metaLine}>
            Tokens are masked. Pull to refresh or tap the refresh icon.
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyState}>No AsyncStorage keys found.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadDump(true)}
              tintColor={colors.primary}
            />
          }
        >
          {sections.map((section, sectionIndex) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(sectionIndex * 60).springify()}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="folder-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>
                  {storedCountInSection(section)}/{section.fields.length}
                </Text>
              </View>

              {section.fields.map((field, fieldIndex) => (
                <View
                  key={field.key}
                  style={[
                    styles.field,
                    fieldIndex === section.fields.length - 1 && styles.fieldLast,
                  ]}
                >
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldKey}>{field.key}</Text>
                  {field.isMasked ? (
                    <View style={styles.maskedBadge}>
                      <Text style={styles.maskedBadgeText}>MASKED</Text>
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.fieldValue,
                      field.isEmpty && styles.emptyValue,
                    ]}
                    selectable
                  >
                    {field.isEmpty ? 'Not set' : field.display}
                  </Text>
                </View>
              ))}
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default DevStorageInspectorScreen;
