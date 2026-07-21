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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
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

const STEPS = [
  { id: 'identity', label: 'Identity', icon: 'person-outline' as const },
  { id: 'details', label: 'Details', icon: 'id-card-outline' as const },
  { id: 'health', label: 'Health', icon: 'medkit-outline' as const },
] as const;

const RELATIONSHIP_ICONS: Record<FamilyRelationship, keyof typeof Ionicons.glyphMap> = {
  self: 'person',
  spouse: 'heart',
  parent: 'people',
  child: 'happy-outline',
  sibling: 'git-network-outline',
  other: 'ellipsis-horizontal',
};

const GENDER_ICONS: Record<FamilyGender, keyof typeof Ionicons.glyphMap> = {
  male: 'male',
  female: 'female',
  other: 'transgender',
  prefer_not_to_say: 'remove-circle-outline',
};

const COMMON_ALLERGY_SET = new Set<string>(COMMON_ALLERGIES);

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

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const FamilyMemberFormSheet = ({
  visible,
  editingMember,
  saving,
  onClose,
  onSubmit,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FamilyMemberFormData>(DEFAULT_FORM);
  const [nameError, setNameError] = useState('');
  const [ageText, setAgeText] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

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
    setStep(0);
    setAllergyInput('');
    setNameError('');
  }, [visible, editingMember]);

  const customAllergies = useMemo(
    () => form.allergies.filter((item) => !COMMON_ALLERGY_SET.has(item)),
    [form.allergies],
  );

  const relationshipLabel =
    FAMILY_RELATIONSHIPS.find((r) => r.id === form.relationship)?.label ?? 'Member';
  const initials = getInitials(form.name);
  const isLastStep = step === STEPS.length - 1;
  const progress = (step + 1) / STEPS.length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.surfaceSecondary,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          maxHeight: '96%',
          overflow: 'hidden',
          ...shadows.lg,
        },
        hero: {
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          paddingHorizontal: spacing.lg,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.35)',
          marginBottom: spacing.md,
        },
        heroTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        closeBtn: {
          width: moderateScale(36),
          height: moderateScale(36),
          borderRadius: moderateScale(18),
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        profilePreview: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        avatarRing: {
          width: moderateScale(56),
          height: moderateScale(56),
          borderRadius: moderateScale(28),
          backgroundColor: 'rgba(255,255,255,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.5)',
        },
        avatarInner: {
          width: moderateScale(46),
          height: moderateScale(46),
          borderRadius: moderateScale(23),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: {
          ...typography.h4,
          color: colors.primary,
          fontWeight: '800',
        },
        heroTextBlock: {
          flex: 1,
        },
        heroTitle: {
          ...typography.h4,
          color: colors.white,
          fontWeight: '700',
        },
        heroSubtitle: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
        },
        progressTrack: {
          height: 4,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 2,
          marginTop: spacing.md,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.white,
          borderRadius: 2,
        },
        stepRow: {
          flexDirection: 'row',
          marginTop: spacing.md,
          gap: spacing.xs,
        },
        stepPill: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingVertical: spacing.xs + 2,
          borderRadius: borderRadius.full,
          backgroundColor: 'rgba(255,255,255,0.12)',
        },
        stepPillActive: {
          backgroundColor: colors.white,
        },
        stepPillDone: {
          backgroundColor: 'rgba(255,255,255,0.3)',
        },
        stepPillLabel: {
          ...typography.caption,
          fontSize: 10,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.75)',
        },
        stepPillLabelActive: {
          color: colors.primary,
        },
        stepPillLabelDone: {
          color: colors.white,
        },
        body: {
          flexGrow: 0,
          flexShrink: 1,
        },
        scroll: {
          paddingHorizontal: spacing.lg,
        },
        scrollContent: {
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        },
        stepCard: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.sm,
        },
        stepHeading: {
          ...typography.body,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xxs,
        },
        stepDesc: {
          ...typography.caption,
          color: colors.textMuted,
          lineHeight: 18,
          marginBottom: spacing.lg,
        },
        fieldBlock: {
          marginBottom: spacing.lg,
        },
        fieldBlockLast: {
          marginBottom: 0,
        },
        labelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        },
        label: {
          ...typography.bodySmall,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        optionalBadge: {
          ...typography.caption,
          fontSize: 10,
          fontWeight: '700',
          color: colors.textMuted,
          backgroundColor: colors.surfaceSecondary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        },
        inputWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceSecondary,
          minHeight: moderateScale(54),
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        },
        inputWrapFocused: {
          borderColor: colors.primary,
          backgroundColor: colors.white,
        },
        inputWrapError: {
          borderColor: colors.error,
          backgroundColor: colors.errorLight,
        },
        input: {
          ...typography.body,
          flex: 1,
          color: colors.textPrimary,
          paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm + 2,
        },
        errorText: {
          ...typography.caption,
          color: colors.error,
          marginTop: spacing.xs,
        },
        relationshipGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        relationCard: {
          width: '31%',
          minWidth: moderateScale(96),
          flexGrow: 1,
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xs,
          borderRadius: borderRadius.lg,
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          backgroundColor: colors.surfaceSecondary,
          gap: spacing.xs,
        },
        relationCardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
        },
        relationIconWrap: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        },
        relationIconWrapSelected: {
          backgroundColor: colors.primary,
        },
        relationLabel: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        relationLabelSelected: {
          color: colors.primary,
        },
        genderRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        genderOption: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.lg,
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          backgroundColor: colors.surfaceSecondary,
          gap: spacing.xs,
        },
        genderOptionSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
        },
        genderLabel: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        genderLabelSelected: {
          color: colors.primary,
        },
        bloodGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        bloodCell: {
          width: '22%',
          minWidth: moderateScale(58),
          flexGrow: 1,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.md,
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        bloodCellSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        bloodLabel: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        bloodLabelSelected: {
          color: colors.white,
        },
        chipsWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.full,
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          backgroundColor: colors.surfaceSecondary,
        },
        chipSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
        },
        chipWarn: {
          borderColor: colors.warning,
          backgroundColor: colors.warningLight,
        },
        chipLabel: {
          ...typography.bodySmall,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chipLabelSelected: {
          color: colors.primary,
        },
        chipLabelWarn: {
          color: colors.warning,
        },
        customChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingRight: spacing.sm,
        },
        tagInputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        tagInputWrap: {
          flex: 1,
        },
        addTagBtn: {
          width: moderateScale(54),
          height: moderateScale(54),
          borderRadius: borderRadius.lg,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        addTagBtnDisabled: {
          opacity: 0.35,
        },
        hint: {
          ...typography.caption,
          color: colors.textMuted,
          lineHeight: 18,
          marginTop: spacing.sm,
        },
        healthNote: {
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: colors.infoLight,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: 'rgba(59,130,246,0.15)',
        },
        healthNoteText: {
          ...typography.caption,
          color: colors.textSecondary,
          flex: 1,
          lineHeight: 18,
        },
        textareaWrap: {
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceSecondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          minHeight: moderateScale(96),
        },
        textarea: {
          ...typography.body,
          color: colors.textPrimary,
          minHeight: moderateScale(72),
          textAlignVertical: 'top',
        },
        footer: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          gap: spacing.sm,
        },
        footerRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        backBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.md + 2,
          borderRadius: borderRadius.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.white,
          minHeight: moderateScale(52),
        },
        backBtnPressed: {
          backgroundColor: colors.surfaceSecondary,
        },
        backBtnText: {
          ...typography.button,
          color: colors.textSecondary,
        },
        primaryBtn: {
          flex: 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md + 2,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.primary,
          minHeight: moderateScale(52),
        },
        primaryBtnFull: {
          flex: 1,
        },
        primaryBtnDisabled: {
          opacity: 0.6,
        },
        primaryBtnPressed: {
          opacity: 0.9,
        },
        primaryBtnText: {
          ...typography.button,
          color: colors.white,
        },
        skipBtn: {
          alignItems: 'center',
          paddingVertical: spacing.xs,
        },
        skipBtnText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textMuted,
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

  const addCustomAllergy = useCallback(() => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;

    setForm((prev) => {
      const withoutNone = prev.allergies.filter((item) => item !== 'None');
      const exists = withoutNone.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, allergies: [...withoutNone, trimmed] };
    });
    setAllergyInput('');
  }, [allergyInput]);

  const removeAllergy = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((item) => item !== value),
    }));
  }, []);

  const validateStep = useCallback((): boolean => {
    if (step !== 0) return true;
    const trimmed = form.name.trim();
    if (trimmed.length < 2) {
      setNameError('Enter at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  }, [form.name, step]);

  const goNext = useCallback(() => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [validateStep]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) {
      setStep(0);
      return;
    }
    const trimmed = form.name.trim();
    await onSubmit({ ...form, name: trimmed });
  }, [form, onSubmit, validateStep]);

  const renderChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    warn = false,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={[
        styles.chip,
        selected && (warn ? styles.chipWarn : styles.chipSelected),
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && (warn ? styles.chipLabelWarn : styles.chipLabelSelected),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const canAddAllergy = allergyInput.trim().length > 0;
  const sheetTitle = editingMember ? 'Edit member' : 'Add family member';

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            key="step-identity"
            entering={FadeInRight.duration(220)}
            exiting={FadeOutLeft.duration(160)}
            style={styles.stepCard}
          >
            <Text style={styles.stepHeading}>Who are you adding?</Text>
            <Text style={styles.stepDesc}>
              Start with their name and how they relate to you.
            </Text>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full name</Text>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  nameError ? styles.inputWrapError : null,
                ]}
              >
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(name) => {
                    setForm((prev) => ({ ...prev, name }));
                    if (nameError) setNameError('');
                  }}
                  autoCapitalize="words"
                  autoFocus
                  accessibilityLabel="Full name"
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={[styles.fieldBlock, styles.fieldBlockLast]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Relationship</Text>
              </View>
              <View style={styles.relationshipGrid}>
                {FAMILY_RELATIONSHIPS.map((item) => {
                  const selected = form.relationship === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          relationship: item.id as FamilyRelationship,
                        }))
                      }
                      style={[
                        styles.relationCard,
                        selected && styles.relationCardSelected,
                      ]}
                      accessibilityLabel={item.label}
                    >
                      <View
                        style={[
                          styles.relationIconWrap,
                          selected && styles.relationIconWrapSelected,
                        ]}
                      >
                        <Ionicons
                          name={RELATIONSHIP_ICONS[item.id]}
                          size={20}
                          color={selected ? colors.white : colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.relationLabel,
                          selected && styles.relationLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View
            key="step-details"
            entering={FadeInRight.duration(220)}
            exiting={FadeOutLeft.duration(160)}
            style={styles.stepCard}
          >
            <Text style={styles.stepHeading}>Basic details</Text>
            <Text style={styles.stepDesc}>
              Optional info that helps personalize medicine care.
            </Text>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.genderRow}>
                {FAMILY_GENDERS.map((item) => {
                  const selected = form.gender === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          gender:
                            prev.gender === item.id
                              ? null
                              : (item.id as FamilyGender),
                        }))
                      }
                      style={[
                        styles.genderOption,
                        selected && styles.genderOptionSelected,
                      ]}
                      accessibilityLabel={item.label}
                    >
                      <Ionicons
                        name={GENDER_ICONS[item.id]}
                        size={20}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.genderLabel,
                          selected && styles.genderLabelSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Age (years)</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
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
            </View>

            <View style={[styles.fieldBlock, styles.fieldBlockLast]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Blood group</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.bloodGrid}>
                {BLOOD_GROUPS.map((group) => {
                  const selected = form.bloodGroup === group;
                  const label = group === 'unknown' ? '?' : group;
                  return (
                    <Pressable
                      key={group}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          bloodGroup:
                            prev.bloodGroup === group
                              ? null
                              : (group as BloodGroup),
                        }))
                      }
                      style={[
                        styles.bloodCell,
                        selected && styles.bloodCellSelected,
                      ]}
                      accessibilityLabel={
                        group === 'unknown' ? 'Unknown blood group' : group
                      }
                    >
                      <Text
                        style={[
                          styles.bloodLabel,
                          selected && styles.bloodLabelSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            key="step-health"
            entering={FadeInRight.duration(220)}
            exiting={FadeOutLeft.duration(160)}
            style={styles.stepCard}
          >
            <Text style={styles.stepHeading}>Health safety</Text>
            <Text style={styles.stepDesc}>
              Helps flag unsafe medicines when ordering for this person.
            </Text>

            <View style={styles.healthNote}>
              <Ionicons name="shield-checkmark" size={18} color={colors.info} />
              <Text style={styles.healthNoteText}>
                All fields here are optional. You can update them anytime from the
                member card.
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Known allergies</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.chipsWrap}>
                {COMMON_ALLERGIES.filter((item) => item !== 'Other').map((item) =>
                  renderChip(
                    item,
                    item,
                    form.allergies.includes(item),
                    () =>
                      setForm((prev) => ({
                        ...prev,
                        allergies: toggleExclusiveChip(prev.allergies, item),
                      })),
                    item !== 'None',
                  ),
                )}
                {customAllergies.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => removeAllergy(item)}
                    style={[
                      styles.chip,
                      styles.chipWarn,
                      styles.customChip,
                    ]}
                    accessibilityLabel={`Remove ${item}`}
                  >
                    <Text style={[styles.chipLabel, styles.chipLabelWarn]}>
                      {item}
                    </Text>
                    <Ionicons name="close-circle" size={16} color={colors.warning} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.tagInputRow}>
                <View style={[styles.inputWrap, styles.tagInputWrap]}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Add another allergy"
                    placeholderTextColor={colors.textMuted}
                    value={allergyInput}
                    onChangeText={setAllergyInput}
                    onSubmitEditing={addCustomAllergy}
                    returnKeyType="done"
                    autoCapitalize="sentences"
                    accessibilityLabel="Add custom allergy"
                  />
                </View>
                <Pressable
                  onPress={addCustomAllergy}
                  disabled={!canAddAllergy}
                  style={[
                    styles.addTagBtn,
                    !canAddAllergy && styles.addTagBtnDisabled,
                  ]}
                  accessibilityLabel="Add allergy"
                >
                  <Ionicons name="arrow-forward" size={22} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Chronic conditions</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
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
            </View>

            <View style={[styles.fieldBlock, styles.fieldBlockLast]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Current medicines</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.textareaWrap}>
                <TextInput
                  style={styles.textarea}
                  placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                  placeholderTextColor={colors.textMuted}
                  value={form.currentMedicines}
                  onChangeText={(currentMedicines) =>
                    setForm((prev) => ({ ...prev, currentMedicines }))
                  }
                  multiline
                  accessibilityLabel="Current medicines"
                />
              </View>
              <Text style={styles.hint}>
                Separate multiple medicines with commas
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <LinearGradient
            colors={gradients.settingsHero}
            locations={[0, 0.5, 1]}
            style={styles.hero}
          >
            <View style={styles.handle} />
            <View style={styles.heroTopRow}>
              <View style={styles.profilePreview}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {form.name.trim() || sheetTitle}
                  </Text>
                  <Text style={styles.heroSubtitle} numberOfLines={1}>
                    {form.name.trim()
                      ? `${relationshipLabel} · Step ${step + 1} of ${STEPS.length}`
                      : `Step ${step + 1} of ${STEPS.length}`}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.stepRow}>
              {STEPS.map((item, index) => {
                const isActive = index === step;
                const isDone = index < step;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.stepPill,
                      isActive && styles.stepPillActive,
                      isDone && styles.stepPillDone,
                    ]}
                  >
                    <Ionicons
                      name={isDone ? 'checkmark' : item.icon}
                      size={12}
                      color={
                        isActive
                          ? colors.primary
                          : isDone
                            ? colors.white
                            : 'rgba(255,255,255,0.7)'
                      }
                    />
                    <Text
                      style={[
                        styles.stepPillLabel,
                        isActive && styles.stepPillLabelActive,
                        isDone && styles.stepPillLabelDone,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.scroll, styles.scrollContent]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              {step > 0 ? (
                <Pressable
                  onPress={goBack}
                  style={({ pressed }) => [
                    styles.backBtn,
                    pressed && styles.backBtnPressed,
                  ]}
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                  <Text style={styles.backBtnText}>Back</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => (isLastStep ? void handleSubmit() : goNext())}
                disabled={saving}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  step === 0 && styles.primaryBtnFull,
                  saving && styles.primaryBtnDisabled,
                  pressed && !saving && styles.primaryBtnPressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {isLastStep
                        ? editingMember
                          ? 'Save changes'
                          : 'Add member'
                        : 'Continue'}
                    </Text>
                    <Ionicons
                      name={isLastStep ? 'checkmark-circle' : 'arrow-forward'}
                      size={20}
                      color={colors.white}
                    />
                  </>
                )}
              </Pressable>
            </View>

            {step === 2 && !saving ? (
              <Pressable
                onPress={() => void handleSubmit()}
                style={styles.skipBtn}
                accessibilityLabel="Save without health details"
              >
                <Text style={styles.skipBtnText}>Save without health details</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FamilyMemberFormSheet;
