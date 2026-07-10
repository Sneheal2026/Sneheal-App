import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  BLOOD_GROUPS,
  COMMON_ALLERGIES,
  COMMON_CONDITIONS,
  FAMILY_GENDERS,
  FAMILY_RELATIONSHIPS,
} from '@/constants/familyHealth';
import type {
  BloodGroup,
  FamilyGender,
  FamilyMember,
  FamilyMemberFormData,
  FamilyRelationship,
} from '@/types/family.types';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  visible: boolean;
  editingMember: FamilyMember | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: FamilyMemberFormData) => Promise<boolean>;
};

const DEFAULT_FORM: FamilyMemberFormData = {
  name: '',
  relationship: 'self',
  gender: null,
  ageYears: null,
  bloodGroup: null,
  allergies: [],
  conditions: [],
  currentMedicines: '',
};

const toggleExclusiveChip = (
  current: string[],
  value: string,
  noneLabel = 'None',
): string[] => {
  if (value === noneLabel) {
    return current.includes(noneLabel) ? [] : [noneLabel];
  }

  const withoutNone = current.filter((item) => item !== noneLabel);
  if (withoutNone.includes(value)) {
    return withoutNone.filter((item) => item !== value);
  }
  return [...withoutNone, value];
};

const FamilyMemberFormSheet = ({
  visible,
  editingMember,
  saving,
  onClose,
  onSubmit,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();
  const [form, setForm] = useState<FamilyMemberFormData>(DEFAULT_FORM);
  const [nameError, setNameError] = useState('');
  const [ageText, setAgeText] = useState('');

  useEffect(() => {
    if (!visible) return;

    if (editingMember) {
      setForm({
        name: editingMember.name,
        relationship: editingMember.relationship,
        gender: editingMember.gender,
        ageYears: editingMember.ageYears,
        bloodGroup: editingMember.bloodGroup,
        allergies: [...editingMember.allergies],
        conditions: [...editingMember.conditions],
        currentMedicines: editingMember.currentMedicines,
      });
      setAgeText(
        editingMember.ageYears != null ? String(editingMember.ageYears) : '',
      );
    } else {
      setForm(DEFAULT_FORM);
      setAgeText('');
    }
    setNameError('');
  }, [visible, editingMember]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.white,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          maxHeight: '92%',
          paddingBottom: Math.max(insets.bottom, spacing.md),
          ...shadows.lg,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        headerTitle: {
          ...typography.h4,
          flex: 1,
          color: colors.textPrimary,
        },
        closeBtn: {
          width: moderateScale(34),
          height: moderateScale(34),
          borderRadius: moderateScale(17),
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scroll: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
        },
        scrollContent: {
          paddingBottom: spacing.xl,
          gap: spacing.md,
        },
        sectionTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
          marginTop: spacing.xs,
        },
        label: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        },
        input: {
          ...typography.bodySmall,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
        },
        inputError: {
          borderColor: colors.error,
        },
        errorText: {
          ...typography.caption,
          color: colors.error,
          marginTop: -spacing.xs,
        },
        hint: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: -spacing.xs,
        },
        chipsWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
        },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
        chipSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
        },
        chipLabel: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chipLabelSelected: {
          color: colors.primary,
        },
        saveBtn: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md + 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        saveBtnDisabled: {
          opacity: 0.6,
        },
        saveBtnPressed: {
          opacity: 0.9,
        },
        saveBtnText: {
          ...typography.button,
          color: colors.white,
        },
      }),
    [borderRadius, colors, insets.bottom, moderateScale, shadows, spacing, typography],
  );

  const handleAgeChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 3);
    setAgeText(digits);
    if (!digits) {
      setForm((prev) => ({ ...prev, ageYears: null }));
      return;
    }
    const age = Number(digits);
    setForm((prev) => ({
      ...prev,
      ageYears: Number.isFinite(age) ? Math.min(120, age) : null,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = form.name.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError('');
    await onSubmit({ ...form, name: trimmed });
  }, [form, onSubmit]);

  const renderChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingMember ? 'Edit member' : 'Add family member'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={colors.textMuted}
                value={form.name}
                onChangeText={(name) => {
                  setForm((prev) => ({ ...prev, name }));
                  if (nameError) setNameError('');
                }}
                autoCapitalize="words"
                accessibilityLabel="Full name"
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={styles.sectionTitle}>Relationship</Text>
            <View style={styles.chipsWrap}>
              {FAMILY_RELATIONSHIPS.map((item) =>
                renderChip(
                  item.id,
                  item.label,
                  form.relationship === item.id,
                  () =>
                    setForm((prev) => ({
                      ...prev,
                      relationship: item.id as FamilyRelationship,
                    })),
                ),
              )}
            </View>

            <Text style={styles.sectionTitle}>Basics</Text>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipsWrap}>
              {FAMILY_GENDERS.map((item) =>
                renderChip(
                  item.id,
                  item.label,
                  form.gender === item.id,
                  () =>
                    setForm((prev) => ({
                      ...prev,
                      gender:
                        prev.gender === item.id
                          ? null
                          : (item.id as FamilyGender),
                    })),
                ),
              )}
            </View>

            <View>
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 34"
                placeholderTextColor={colors.textMuted}
                value={ageText}
                onChangeText={handleAgeChange}
                keyboardType="number-pad"
                accessibilityLabel="Age in years"
              />
            </View>

            <Text style={styles.label}>Blood group</Text>
            <View style={styles.chipsWrap}>
              {BLOOD_GROUPS.map((group) =>
                renderChip(
                  group,
                  group === 'unknown' ? 'Unknown' : group,
                  form.bloodGroup === group,
                  () =>
                    setForm((prev) => ({
                      ...prev,
                      bloodGroup:
                        prev.bloodGroup === group
                          ? null
                          : (group as BloodGroup),
                    })),
                ),
              )}
            </View>

            <Text style={styles.sectionTitle}>Health safety</Text>
            <Text style={styles.label}>Allergies</Text>
            <View style={styles.chipsWrap}>
              {COMMON_ALLERGIES.map((item) =>
                renderChip(
                  item,
                  item,
                  form.allergies.includes(item),
                  () =>
                    setForm((prev) => ({
                      ...prev,
                      allergies: toggleExclusiveChip(prev.allergies, item),
                    })),
                ),
              )}
            </View>

            <Text style={styles.label}>Chronic conditions</Text>
            <View style={styles.chipsWrap}>
              {COMMON_CONDITIONS.map((item) =>
                renderChip(
                  item,
                  item,
                  form.conditions.includes(item),
                  () =>
                    setForm((prev) => ({
                      ...prev,
                      conditions: toggleExclusiveChip(prev.conditions, item),
                    })),
                ),
              )}
            </View>

            <View>
              <Text style={styles.label}>Current medicines (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
                placeholder="e.g. Metformin 500mg, Amlodipine"
                placeholderTextColor={colors.textMuted}
                value={form.currentMedicines}
                onChangeText={(currentMedicines) =>
                  setForm((prev) => ({ ...prev, currentMedicines }))
                }
                multiline
                accessibilityLabel="Current medicines"
              />
              <Text style={styles.hint}>
                Helps avoid unsafe medicine combinations when ordering
              </Text>
            </View>
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
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {editingMember ? 'Save changes' : 'Add member'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FamilyMemberFormSheet;
