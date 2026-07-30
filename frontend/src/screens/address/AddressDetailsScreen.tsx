import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { saveAddress } from '@/services/addressStorage';
import type { AddressType } from '@/types/location.types';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

const ADDRESS_TYPES: { key: AddressType; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', labelKey: 'addresses.typeHome', icon: 'home-outline' },
  { key: 'work', labelKey: 'addresses.typeWork', icon: 'briefcase-outline' },
  { key: 'other', labelKey: 'addresses.typeOther', icon: 'location-outline' },
];

const AddressDetailsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'AddressDetails'>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'AddressDetails'>>();
  const { t } = useTranslation();
  const { colors, spacing, typography, moderateScale, borderRadius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: colors.background,
        },
        flex: {
          flex: 1,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
        backButton: {
          width: moderateScale(38),
          height: moderateScale(38),
          borderRadius: moderateScale(19),
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          ...typography.h4,
          flex: 1,
          fontSize: moderateScale(18),
        },
        headerSpacer: {
          width: moderateScale(38),
        },
        addressPreview: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surfaceSecondary,
          borderRadius: borderRadius.md,
        },
        addressPreviewText: {
          ...typography.caption,
          flex: 1,
          color: colors.textSecondary,
        },
        changeText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
        formContent: {
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.xs,
        },
        label: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
        },
        input: {
          ...typography.body,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: Platform.select({ ios: spacing.md, android: spacing.sm }),
          color: colors.textPrimary,
        },
        phoneRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        phonePrefix: {
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: Platform.select({ ios: spacing.md, android: spacing.sm }),
          justifyContent: 'center',
        },
        phonePrefixText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        phoneInput: {
          flex: 1,
        },
        typeRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        typeChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
        typeChipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        typeLabel: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        typeLabelActive: {
          color: colors.white,
        },
        bottomSafe: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        saveButton: {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md + 2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        saveDisabled: {
          opacity: 0.45,
        },
        saveText: {
          ...typography.button,
          color: colors.textInverse,
        },
      }),
    [borderRadius, colors, moderateScale, spacing, typography],
  );

  const { draft, editAddress, returnTo = 'Main' } = route.params;

  const [flatNumber, setFlatNumber] = useState(editAddress?.flatNumber ?? '');
  const [landmark, setLandmark] = useState(editAddress?.landmark ?? '');
  const [receiverName, setReceiverName] = useState(editAddress?.receiverName ?? '');
  const [mobile, setMobile] = useState(editAddress?.mobile ?? '');
  const [addressType, setAddressType] = useState<AddressType>(editAddress?.type ?? 'home');
  const [customLabel, setCustomLabel] = useState(editAddress?.customTypeLabel ?? '');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editAddress;

  const isValid = useMemo(() => {
    const hasFlat = flatNumber.trim().length > 0;
    const hasName = receiverName.trim().length >= 2;
    const hasPhone = /^[6-9]\d{9}$/.test(mobile.trim());
    const hasCustom = addressType !== 'other' || customLabel.trim().length > 0;
    return hasFlat && hasName && hasPhone && hasCustom;
  }, [flatNumber, receiverName, mobile, addressType, customLabel]);

  const handleSave = useCallback(async () => {
    if (!isValid || saving) return;
    setSaving(true);

    try {
      const address = {
        id: editAddress?.id,
        coords: draft.coords,
        addressLine: draft.addressLine,
        flatNumber: flatNumber.trim(),
        landmark: landmark.trim(),
        receiverName: receiverName.trim(),
        mobile: mobile.trim(),
        type: addressType,
        customTypeLabel: addressType === 'other' ? customLabel.trim() : '',
        isDefault: editAddress?.isDefault ?? returnTo === 'Main',
      };

      await saveAddress(address);

      if (returnTo === 'Main') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        navigation.navigate('SavedAddresses');
      }
    } catch {
      Alert.alert(t('common.error'), t('addresses.saveError'));
    } finally {
      setSaving(false);
    }
  }, [
    isValid, saving, editAddress, draft, flatNumber, landmark,
    receiverName, mobile, addressType, customLabel, navigation, returnTo, t,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={moderateScale(20)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? t('addresses.editTitle') : t('addresses.addTitle')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Address preview ── */}
        <View style={styles.addressPreview}>
          <Ionicons name="location-sharp" size={moderateScale(16)} color={colors.primary} />
          <Text style={styles.addressPreviewText} numberOfLines={2}>
            {draft.addressLine}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t('addresses.changeLocationA11y')}
          >
            <Text style={styles.changeText}>{t('common.change')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t('addresses.flatLabel')}</Text>
          <TextInput
            style={styles.input}
            value={flatNumber}
            onChangeText={setFlatNumber}
            placeholder={t('addresses.flatPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>{t('addresses.landmarkLabel')}</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder={t('addresses.landmarkPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>{t('addresses.receiverLabel')}</Text>
          <TextInput
            style={styles.input}
            value={receiverName}
            onChangeText={setReceiverName}
            placeholder={t('addresses.receiverPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>{t('addresses.mobileLabel')}</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={mobile}
              onChangeText={(text) => setMobile(text.replace(/\D/g, '').slice(0, 10))}
              placeholder={t('addresses.mobilePlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.label}>{t('addresses.saveAsLabel')}</Text>
          <View style={styles.typeRow}>
            {ADDRESS_TYPES.map((typeOption) => {
              const active = addressType === typeOption.key;
              return (
                <TouchableOpacity
                  key={typeOption.key}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setAddressType(typeOption.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <Ionicons
                    name={typeOption.icon}
                    size={moderateScale(16)}
                    color={active ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                    {t(typeOption.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {addressType === 'other' && (
            <>
              <Text style={styles.label}>{t('addresses.labelName')}</Text>
              <TextInput
                style={styles.input}
                value={customLabel}
                onChangeText={setCustomLabel}
                placeholder={t('addresses.labelPlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </>
          )}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
          <TouchableOpacity
            style={[styles.saveButton, (!isValid || saving) && styles.saveDisabled]}
            onPress={handleSave}
            disabled={!isValid || saving}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('addresses.saveA11y')}
          >
            {saving ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.saveText}>
                {isEditing ? t('addresses.updateAddress') : t('addresses.saveAddress')}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddressDetailsScreen;
