import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getBloodGroupLabel,
  getGenderLabel,
  getRelationshipLabel,
} from '@/constants/familyHealth';
import type { FamilyMember } from '@/types/family.types';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
};

const FamilyMemberCard = ({ member, onEdit, onDelete }: Props) => {
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.sm,
          gap: spacing.sm,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
        },
        avatar: {
          width: moderateScale(44),
          height: moderateScale(44),
          borderRadius: moderateScale(22),
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
          gap: 2,
        },
        name: {
          ...typography.body,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        meta: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        actions: {
          flexDirection: 'row',
          gap: spacing.xs,
        },
        iconBtn: {
          width: moderateScale(34),
          height: moderateScale(34),
          borderRadius: moderateScale(17),
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        chipsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
          marginTop: spacing.xxs,
        },
        chip: {
          backgroundColor: colors.primarySurface,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          borderRadius: borderRadius.full,
        },
        chipWarn: {
          backgroundColor: colors.warningLight,
        },
        chipText: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: '600',
          color: colors.primary,
        },
        chipWarnText: {
          color: colors.warning,
        },
        emptyHealth: {
          ...typography.caption,
          color: colors.textMuted,
          fontStyle: 'italic',
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const metaParts = [
    getRelationshipLabel(member.relationship),
    member.ageYears != null ? `${member.ageYears} yrs` : null,
    getGenderLabel(member.gender),
    getBloodGroupLabel(member.bloodGroup),
  ].filter(Boolean);

  const allergyChips = member.allergies.filter((item) => item !== 'None');
  const conditionChips = member.conditions.filter((item) => item !== 'None');
  const hasHealth =
    allergyChips.length > 0 ||
    conditionChips.length > 0 ||
    Boolean(member.currentMedicines.trim());

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.meta}>{metaParts.join(' · ')}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onEdit}
            style={styles.iconBtn}
            accessibilityLabel={`Edit ${member.name}`}
          >
            <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={styles.iconBtn}
            accessibilityLabel={`Delete ${member.name}`}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {hasHealth ? (
        <View style={styles.chipsRow}>
          {allergyChips.map((item) => (
            <View key={`a-${item}`} style={[styles.chip, styles.chipWarn]}>
              <Text style={[styles.chipText, styles.chipWarnText]}>{item}</Text>
            </View>
          ))}
          {conditionChips.map((item) => (
            <View key={`c-${item}`} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
            </View>
          ))}
          {member.currentMedicines.trim() ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>On medicines</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptyHealth}>No health details added yet</Text>
      )}
    </View>
  );
};

export default FamilyMemberCard;
