import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import type { AddressLabel } from '@/types/address';

const { colors, spacing, borderRadius, typography, moderateScale } = theme;

interface AddressDetailsSheetProps {
  isVisible: boolean;
  detectedAreaName?: string;
  onClose: () => void;
  onSave: (details: AddressFormData) => void;
}

export interface AddressFormData {
  areaName: string;
  flatHouse: string;
  landmark: string;
  receiverName: string;
  phone: string;
  label: AddressLabel;
}

const LABEL_OPTIONS: { value: AddressLabel; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'home', label: 'Home', icon: 'home' },
  { value: 'work', label: 'Work', icon: 'briefcase' },
  { value: 'other', label: 'Other', icon: 'location' },
];

const AddressDetailsSheet: React.FC<AddressDetailsSheetProps> = ({
  isVisible,
  detectedAreaName = '',
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [areaName, setAreaName] = useState('');
  const [flatHouse, setFlatHouse] = useState('');
  const [landmark, setLandmark] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<AddressLabel>('home');
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  useEffect(() => {
    if (isVisible && detectedAreaName) {
      setAreaName(detectedAreaName);
    }
  }, [isVisible, detectedAreaName]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

    if (!areaName.trim()) {
      newErrors.areaName = 'Area name is required';
    }
    if (!flatHouse.trim()) {
      newErrors.flatHouse = 'Flat/House number is required';
    }
    if (!receiverName.trim()) {
      newErrors.receiverName = 'Receiver name is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setAreaName('');
    setFlatHouse('');
    setLandmark('');
    setReceiverName('');
    setPhone('');
    setSelectedLabel('home');
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        areaName: areaName.trim(),
        flatHouse: flatHouse.trim(),
        landmark: landmark.trim(),
        receiverName: receiverName.trim(),
        phone: phone.trim(),
        label: selectedLabel,
      });
      handleClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Enter complete address</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Area / Locality name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.areaName && styles.inputError]}
                  placeholder="e.g., Vimana Puri, Gachibowli"
                  placeholderTextColor={colors.textMuted}
                  value={areaName}
                  onChangeText={(text) => {
                    setAreaName(text);
                    if (errors.areaName) setErrors({ ...errors, areaName: undefined });
                  }}
                />
                {errors.areaName && <Text style={styles.errorText}>{errors.areaName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Flat / House no. & Floor <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.flatHouse && styles.inputError]}
                  placeholder="e.g., 201, 2nd Floor"
                  placeholderTextColor={colors.textMuted}
                  value={flatHouse}
                  onChangeText={(text) => {
                    setFlatHouse(text);
                    if (errors.flatHouse) setErrors({ ...errors, flatHouse: undefined });
                  }}
                />
                {errors.flatHouse && <Text style={styles.errorText}>{errors.flatHouse}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Building / Street / Landmark</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Near KFC"
                  placeholderTextColor={colors.textMuted}
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Receiver name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.receiverName && styles.inputError]}
                  placeholder="Enter receiver's name"
                  placeholderTextColor={colors.textMuted}
                  value={receiverName}
                  onChangeText={(text) => {
                    setReceiverName(text);
                    if (errors.receiverName) setErrors({ ...errors, receiverName: undefined });
                  }}
                />
                {errors.receiverName && <Text style={styles.errorText}>{errors.receiverName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone number to call <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, ''));
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Save as</Text>
                <View style={styles.labelChips}>
                  {LABEL_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        selectedLabel === option.value && styles.chipSelected,
                      ]}
                      onPress={() => setSelectedLabel(option.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={selectedLabel === option.value ? colors.white : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          selectedLabel === option.value && styles.chipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>Save address</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '88%',
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.body,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    fontSize: moderateScale(12),
    color: colors.error,
  },
  labelChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    ...typography.button,
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.white,
  },
});

export default AddressDetailsSheet;
