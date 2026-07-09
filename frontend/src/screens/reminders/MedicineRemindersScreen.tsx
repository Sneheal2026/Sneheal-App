import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ReminderCard from '@/components/reminders/ReminderCard';
import ReminderFormSheet from '@/components/reminders/ReminderFormSheet';
import { useMedicineReminders } from '@/hooks/useMedicineReminders';
import { rescheduleAllReminders } from '@/services/reminderNotificationService';
import {
  openBatteryOptimizationSettings,
  openExactAlarmPermissionSettings,
} from '@/utils/androidReminderSetup';
import type { MedicineReminder, ReminderFormData } from '@/types/reminder.types';
import { useTheme } from '@/hooks/useTheme';

const MedicineRemindersScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } = useTheme();
  const {
    reminders,
    loading,
    permissionStatus,
    refresh,
    addReminder,
    updateReminder,
    toggleReminder,
    removeReminder,
    markDoseTaken,
    requestPermissions,
  } = useMedicineReminders();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MedicineReminder | null>(null);
  const [saving, setSaving] = useState(false);

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
        headerSpacer: {
          width: moderateScale(40),
        },
        body: {
          flex: 1,
          marginTop: -spacing.sm,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          paddingTop: spacing.lg,
          paddingHorizontal: spacing.lg,
        },
        permissionBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.warningLight,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(245,158,11,0.25)',
        },
        bannerPressed: { opacity: 0.9 },
        permissionText: { flex: 1 },
        permissionTitle: {
          ...typography.bodySmall,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        permissionSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 2,
        },
        androidSetupCard: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.primaryLight,
          ...shadows.sm,
        },
        androidSetupHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        androidSetupTitle: {
          ...typography.bodySmall,
          color: colors.textPrimary,
          fontWeight: '700',
          flex: 1,
        },
        androidSetupBody: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 18,
          marginBottom: spacing.md,
        },
        androidSetupActions: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        androidSetupBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.lg,
        },
        androidSetupBtnPrimary: {
          backgroundColor: colors.primary,
        },
        androidSetupBtnPrimaryText: {
          ...typography.caption,
          color: colors.white,
          fontWeight: '700',
        },
        androidSetupBtnSecondary: {
          backgroundColor: colors.infoLight,
          borderWidth: 1,
          borderColor: colors.border,
        },
        androidSetupBtnSecondaryText: {
          ...typography.caption,
          color: colors.primary,
          fontWeight: '700',
        },
        loadingWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        listContent: {
          paddingBottom: spacing.xxl * 2,
        },
        listContentEmpty: {
          flexGrow: 1,
          justifyContent: 'center',
        },
        emptyWrap: {
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
        },
        emptyIconCircle: {
          width: moderateScale(100),
          height: moderateScale(100),
          borderRadius: moderateScale(50),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
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
          marginTop: spacing.sm,
          lineHeight: 22,
        },
        emptyCta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.full,
          marginTop: spacing.xl,
          ...shadows.md,
        },
        emptyCtaPressed: { opacity: 0.9 },
        emptyCtaText: {
          ...typography.bodySmall,
          color: colors.white,
          fontWeight: '700',
        },
        fab: {
          position: 'absolute',
          right: spacing.xl,
          bottom: spacing.xl,
          ...shadows.lg,
        },
        fabPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
        fabGradient: {
          width: moderateScale(56),
          height: moderateScale(56),
          borderRadius: moderateScale(28),
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await rescheduleAllReminders();
        await refresh();
      })();
    }, [refresh]),
  );

  const openAddSheet = useCallback(() => {
    setEditingReminder(null);
    setSheetVisible(true);
  }, []);

  const openEditSheet = useCallback((reminder: MedicineReminder) => {
    setEditingReminder(reminder);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setEditingReminder(null);
  }, []);

  const handleSubmit = useCallback(
    async (data: ReminderFormData): Promise<boolean> => {
      setSaving(true);
      try {
        if (editingReminder) {
          return await updateReminder(editingReminder.id, data);
        }
        return await addReminder(data);
      } finally {
        setSaving(false);
      }
    },
    [addReminder, editingReminder, updateReminder],
  );

  const handleDelete = useCallback(
    (reminder: MedicineReminder) => {
      Alert.alert(
        'Delete reminder',
        `Remove reminders for ${reminder.medicineName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void removeReminder(reminder.id),
          },
        ],
      );
    },
    [removeReminder],
  );

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Notifications blocked',
        'Open your phone settings and allow notifications for Sneheal.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open settings',
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
    }
    await refresh();
  }, [requestPermissions, refresh]);

  const renderEmpty = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
      <LinearGradient
        colors={[colors.infoLight, colors.white]}
        style={styles.emptyIconCircle}
      >
        <Ionicons name="alarm-outline" size={moderateScale(48)} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No reminders yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your medicines and we will notify you every day at the times you choose.
      </Text>
      <Pressable
        onPress={openAddSheet}
        style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
      >
        <Ionicons name="add-circle" size={20} color={colors.white} />
        <Text style={styles.emptyCtaText}>Add your first reminder</Text>
      </Pressable>
    </Animated.View>
  );

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
              <Text style={styles.headerTitle}>Medicine reminders</Text>
              <Text style={styles.headerSubtitle}>Never miss a dose</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {permissionStatus !== 'granted' && (
          <Pressable
            onPress={() => void handleEnableNotifications()}
            style={({ pressed }) => [styles.permissionBanner, pressed && styles.bannerPressed]}
          >
            <Ionicons name="notifications-off-outline" size={22} color={colors.warning} />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Turn on notifications</Text>
              <Text style={styles.permissionSubtitle}>
                Required for daily medicine reminders
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        {Platform.OS === 'android' && (
          <View style={styles.androidSetupCard}>
            <View style={styles.androidSetupHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={styles.androidSetupTitle}>Reminders when app is closed</Text>
            </View>
            <Text style={styles.androidSetupBody}>
              Android blocks timers after you swipe Sneheal away unless you allow
              Alarms & reminders and unrestricted battery.
            </Text>
            <View style={styles.androidSetupActions}>
              <Pressable
                onPress={() => void openExactAlarmPermissionSettings()}
                style={({ pressed }) => [
                  styles.androidSetupBtn,
                  styles.androidSetupBtnPrimary,
                  pressed && styles.bannerPressed,
                ]}
              >
                <Ionicons name="alarm-outline" size={16} color={colors.white} />
                <Text style={styles.androidSetupBtnPrimaryText}>Alarms & reminders</Text>
              </Pressable>
              <Pressable
                onPress={() => void openBatteryOptimizationSettings()}
                style={({ pressed }) => [
                  styles.androidSetupBtn,
                  styles.androidSetupBtnSecondary,
                  pressed && styles.bannerPressed,
                ]}
              >
                <Ionicons name="battery-charging-outline" size={16} color={colors.primary} />
                <Text style={styles.androidSetupBtnSecondaryText}>Battery</Text>
              </Pressable>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
                <ReminderCard
                  reminder={item}
                  onToggle={(enabled) => void toggleReminder(item.id, enabled)}
                  onEdit={() => openEditSheet(item)}
                  onDelete={() => handleDelete(item)}
                  onMarkTaken={() => void markDoseTaken(item.id)}
                />
              </Animated.View>
            )}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              reminders.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {reminders.length > 0 && (
        <Pressable
          onPress={openAddSheet}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityLabel="Add reminder"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </LinearGradient>
        </Pressable>
      )}

      <ReminderFormSheet
        visible={sheetVisible}
        editingReminder={editingReminder}
        saving={saving}
        onClose={closeSheet}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

export default MedicineRemindersScreen;
