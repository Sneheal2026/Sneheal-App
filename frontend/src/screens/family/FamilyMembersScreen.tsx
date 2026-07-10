import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FamilyMemberCard from '@/components/family/FamilyMemberCard';
import FamilyMemberFormSheet from '@/components/family/FamilyMemberFormSheet';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import type { FamilyMember, FamilyMemberFormData } from '@/types/family.types';
import { useTheme } from '@/hooks/useTheme';

const FamilyMembersScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();
  const { members, loading, refresh, addMember, updateMember, removeMember } =
    useFamilyMembers();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
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
        infoBanner: {
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: colors.primarySurface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.primaryLight,
        },
        infoText: {
          ...typography.caption,
          color: colors.textSecondary,
          flex: 1,
          lineHeight: 18,
        },
        listContent: {
          gap: spacing.sm,
          paddingBottom: spacing.xxxxxl,
          flexGrow: 1,
        },
        listContentEmpty: {
          justifyContent: 'center',
        },
        emptyWrap: {
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        emptyIconCircle: {
          width: moderateScale(88),
          height: moderateScale(88),
          borderRadius: moderateScale(44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.textPrimary,
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        emptyCta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          marginTop: spacing.md,
        },
        emptyCtaPressed: { opacity: 0.9 },
        emptyCtaText: {
          ...typography.button,
          color: colors.white,
        },
        fab: {
          position: 'absolute',
          right: spacing.xl,
          bottom: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          ...shadows.md,
        },
        fabPressed: { opacity: 0.9 },
        fabText: {
          ...typography.button,
          color: colors.white,
        },
        loaderWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openAddSheet = useCallback(() => {
    setEditingMember(null);
    setSheetVisible(true);
  }, []);

  const openEditSheet = useCallback((member: FamilyMember) => {
    setEditingMember(member);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setEditingMember(null);
  }, []);

  const handleSubmit = useCallback(
    async (data: FamilyMemberFormData) => {
      setSaving(true);
      try {
        if (editingMember) {
          await updateMember(editingMember.id, data);
        } else {
          await addMember(data);
        }
        closeSheet();
        return true;
      } catch {
        Alert.alert('Could not save', 'Please try again.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addMember, closeSheet, editingMember, updateMember],
  );

  const handleDelete = useCallback(
    (member: FamilyMember) => {
      Alert.alert(
        'Remove member',
        `Remove ${member.name} from your family list?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => void removeMember(member.id),
          },
        ],
      );
    },
    [removeMember],
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
      <LinearGradient
        colors={[colors.infoLight, colors.white]}
        style={styles.emptyIconCircle}
      >
        <Ionicons name="people-outline" size={moderateScale(48)} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No family members yet</Text>
      <Text style={styles.emptySubtitle}>
        Add yourself and family so medicine orders and reminders stay personal and safer.
      </Text>
      <Pressable
        onPress={openAddSheet}
        style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
      >
        <Ionicons name="person-add" size={20} color={colors.white} />
        <Text style={styles.emptyCtaText}>Add first member</Text>
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
              <Text style={styles.headerTitle}>Family members</Text>
              <Text style={styles.headerSubtitle}>Health details for safer care</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {loading && members.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            {members.length > 0 ? (
              <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>
                  Allergies and conditions help us flag unsafe medicines when you order for
                  someone.
                </Text>
              </View>
            ) : null}

            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FamilyMemberCard
                  member={item}
                  onEdit={() => openEditSheet(item)}
                  onDelete={() => handleDelete(item)}
                />
              )}
              contentContainerStyle={[
                styles.listContent,
                members.length === 0 && styles.listContentEmpty,
              ]}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      {members.length > 0 ? (
        <Pressable
          onPress={openAddSheet}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityLabel="Add family member"
        >
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.fabText}>Add</Text>
        </Pressable>
      ) : null}

      <FamilyMemberFormSheet
        visible={sheetVisible}
        editingMember={editingMember}
        saving={saving}
        onClose={closeSheet}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

export default FamilyMembersScreen;
