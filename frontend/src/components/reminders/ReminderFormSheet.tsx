import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { MedicineReminder, ReminderFormData } from '@/types/reminder.types';
import {
  dateFromTimeString,
  formatTimeDisplay,
  QUICK_TIME_PRESETS,
  sortTimes,
  timeStringFromDate,
} from '@/utils/reminderTime';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

interface ReminderFormSheetProps {
  visible: boolean;
  editingReminder: MedicineReminder | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: ReminderFormData) => Promise<boolean>;
}

const DEFAULT_FORM: ReminderFormData = {
  medicineName: '',
  times: ['08:00'],
  dosePerTime: 1,
  totalTablets: 30,
};

const ReminderFormSheet = ({
  visible,
  editingReminder,
  saving,
  onClose,
  onSubmit,
}: ReminderFormSheetProps) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ReminderFormData>(DEFAULT_FORM);
  const [nameError, setNameError] = useState('');
  const [timesError, setTimesError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(dateFromTimeString('08:00'));

  useEffect(() => {
    if (!visible) return;

    if (editingReminder) {
      setForm({
        medicineName: editingReminder.medicineName,
        times: [...editingReminder.times],
        dosePerTime: editingReminder.dosePerTime,
        totalTablets: editingReminder.totalTablets,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setNameError('');
    setTimesError('');
    setShowTimePicker(false);
  }, [visible, editingReminder]);

  const adjustDose = useCallback((delta: number) => {
    setForm((prev) => ({
      ...prev,
      dosePerTime: Math.min(10, Math.max(1, prev.dosePerTime + delta)),
    }));
  }, []);

  const adjustTablets = useCallback((delta: number) => {
    setForm((prev) => ({
      ...prev,
      totalTablets: Math.min(999, Math.max(1, prev.totalTablets + delta)),
    }));
  }, []);

  const addTime = useCallback((time: string) => {
    setTimesError('');
    setForm((prev) => {
      if (prev.times.includes(time)) return prev;
      return { ...prev, times: sortTimes([...prev.times, time]) };
    });
  }, []);

  const removeTime = useCallback((time: string) => {
    setForm((prev) => {
      if (prev.times.length <= 1) {
        setTimesError('At least one reminder time is required');
        return prev;
      }
      setTimesError('');
      return { ...prev, times: prev.times.filter((t) => t !== time) };
    });
  }, []);

  const openCustomTimePicker = useCallback(() => {
    setPickerDate(dateFromTimeString(form.times[0] ?? '08:00'));
    setShowTimePicker(true);
  }, [form.times]);

  const handleTimePickerChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
      if (event.type === 'dismissed' || !date) return;
      addTime(timeStringFromDate(date));
    },
    [addTime],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = form.medicineName.trim();
    if (!trimmed) {
      setNameError('Enter a medicine name');
      return;
    }
    if (form.times.length === 0) {
      setTimesError('Add at least one time');
      return;
    }

    const success = await onSubmit({ ...form, medicineName: trimmed });
    if (success) {
      onClose();
    }
  }, [form, onClose, onSubmit]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {editingReminder ? 'Edit reminder' : 'New reminder'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                We will notify you daily at your chosen times
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.label}>Medicine name</Text>
            <View style={[styles.inputWrap, nameError ? styles.inputError : null]}>
              <Ionicons name="medkit-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dolo 650, Augmentin 625"
                placeholderTextColor={colors.textMuted}
                value={form.medicineName}
                onChangeText={(text) => {
                  setNameError('');
                  setForm((prev) => ({ ...prev, medicineName: text }));
                }}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={styles.label}>Reminder times</Text>
            <View style={styles.presetRow}>
              {QUICK_TIME_PRESETS.map((preset) => {
                const selected = form.times.includes(preset.time);
                return (
                  <Pressable
                    key={preset.time}
                    onPress={() => addTime(preset.time)}
                    style={({ pressed }) => [
                      styles.presetChip,
                      selected && styles.presetChipSelected,
                      pressed && styles.presetChipPressed,
                    ]}
                  >
                    <Ionicons
                      name={preset.icon}
                      size={16}
                      color={selected ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.presetLabel,
                        selected && styles.presetLabelSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={openCustomTimePicker}
              style={({ pressed }) => [styles.customTimeBtn, pressed && styles.customTimeBtnPressed]}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.customTimeText}>Pick custom time</Text>
            </Pressable>

            {showTimePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimePickerChange}
                  minuteInterval={1}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => {
                      addTime(timeStringFromDate(pickerDate));
                      setShowTimePicker(false);
                    }}
                    style={styles.pickerDoneBtn}
                  >
                    <Text style={styles.pickerDoneText}>Add this time</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.selectedTimesWrap}>
              {form.times.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => removeTime(time)}
                  style={styles.selectedTimeChip}
                >
                  <Ionicons name="alarm" size={14} color={colors.primary} />
                  <Text style={styles.selectedTimeText}>{formatTimeDisplay(time)}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
            {timesError ? <Text style={styles.errorText}>{timesError}</Text> : null}

            <Text style={styles.label}>Tablets per dose</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => adjustDose(-1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{form.dosePerTime}</Text>
              <Pressable
                onPress={() => adjustDose(1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <Text style={styles.label}>Total tablets you have</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => adjustTablets(-1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{form.totalTablets}</Text>
              <Pressable
                onPress={() => adjustTablets(1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.hintText}>
              We will track remaining tablets when you mark doses as taken
            </Text>
          </ScrollView>

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              saving && styles.saveBtnDisabled,
              pressed && !saving && styles.saveBtnPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="notifications" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {editingReminder ? 'Save changes' : 'Set reminder'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  closeBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { opacity: 0.7 },
  formContent: {
    paddingBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.xs,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipPressed: { opacity: 0.85 },
  presetLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  presetLabelSelected: {
    color: colors.white,
  },
  customTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  customTimeBtnPressed: { opacity: 0.7 },
  customTimeText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  pickerWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pickerDoneBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickerDoneText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  selectedTimesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  selectedTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  selectedTimeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepperBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  stepperBtnPressed: { opacity: 0.75 },
  stepperValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ReminderFormSheet;
