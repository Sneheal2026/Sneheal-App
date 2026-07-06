import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { MedicineReminder } from '@/types/reminder.types';
import { formatTimeDisplay } from '@/utils/reminderTime';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

interface ReminderCardProps {
  reminder: MedicineReminder;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkTaken: () => void;
}

const ReminderCard = ({
  reminder,
  onToggle,
  onEdit,
  onDelete,
  onMarkTaken,
}: ReminderCardProps) => {
  const stockPercent =
    reminder.totalTablets > 0
      ? Math.round((reminder.remainingTablets / reminder.totalTablets) * 100)
      : 0;
  const isLowStock =
    reminder.remainingTablets > 0 &&
    reminder.remainingTablets <= reminder.dosePerTime * reminder.times.length * 3;
  const isEmpty = reminder.remainingTablets === 0;

  return (
    <View style={[styles.card, !reminder.enabled && styles.cardDisabled]}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={
            reminder.enabled
              ? [colors.primary, colors.primaryLight]
              : [colors.textMuted, '#CBD5E1']
          }
          style={styles.iconBadge}
        >
          <Ionicons name="medical" size={moderateScale(20)} color={colors.white} />
        </LinearGradient>

        <View style={styles.headerText}>
          <Text style={styles.medicineName} numberOfLines={1}>
            {reminder.medicineName}
          </Text>
          <Text style={styles.doseText}>
            {reminder.dosePerTime} tablet{reminder.dosePerTime > 1 ? 's' : ''} per dose
          </Text>
        </View>

        <Switch
          value={reminder.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={reminder.enabled ? colors.primary : colors.surface}
          accessibilityLabel={`Toggle reminder for ${reminder.medicineName}`}
        />
      </View>

      <View style={styles.timesRow}>
        {reminder.times.map((time) => (
          <View key={time} style={styles.timeChip}>
            <Ionicons name="alarm-outline" size={14} color={colors.primary} />
            <Text style={styles.timeChipText}>{formatTimeDisplay(time)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stockSection}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockLabel}>Tablets remaining</Text>
          <Text
            style={[
              styles.stockValue,
              isLowStock && styles.stockLow,
              isEmpty && styles.stockEmpty,
            ]}
          >
            {reminder.remainingTablets} / {reminder.totalTablets}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${stockPercent}%` },
              isLowStock && styles.progressLow,
              isEmpty && styles.progressEmpty,
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onMarkTaken}
          disabled={!reminder.enabled || isEmpty}
          style={({ pressed }) => [
            styles.takenBtn,
            (!reminder.enabled || isEmpty) && styles.takenBtnDisabled,
            pressed && reminder.enabled && !isEmpty && styles.takenBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Mark dose as taken"
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.white} />
          <Text style={styles.takenBtnText}>Mark taken</Text>
        </Pressable>

        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Edit reminder"
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Delete reminder"
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  cardDisabled: {
    opacity: 0.72,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  medicineName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  doseText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  timeChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  stockSection: {
    marginTop: spacing.md,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stockLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stockValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  stockLow: {
    color: colors.warning,
  },
  stockEmpty: {
    color: colors.error,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  progressLow: {
    backgroundColor: colors.warning,
  },
  progressEmpty: {
    backgroundColor: colors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  takenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  takenBtnDisabled: {
    backgroundColor: colors.border,
  },
  takenBtnPressed: {
    opacity: 0.88,
  },
  takenBtnText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  iconBtn: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconBtnPressed: {
    opacity: 0.75,
  },
});

export default ReminderCard;
