import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImageFromSource } from '@/utils/imagePicker';
import { savePrescription, fetchPrescriptions } from '@/services/prescriptionService';
import type { SavedPrescription } from '@/types/prescription';
import ImagePreviewModal from '@/components/doctor/ImagePreviewModal';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

interface CartPrescriptionCardProps {
  hasRxItems: boolean;
  attachedPrescription: SavedPrescription | null;
  onAttach: (prescription: SavedPrescription | null) => void;
  prescriptionMode?: 'upload' | 'doctor_call' | null;
  onSelectMode?: (mode: 'upload' | 'doctor_call' | null) => void;
  openPickerSignal?: number; // Allows parent screen to trigger the picker modal
}

export const CartPrescriptionCard = ({
  hasRxItems,
  attachedPrescription,
  onAttach,
  prescriptionMode = null,
  onSelectMode,
  openPickerSignal,
}: CartPrescriptionCardProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedList, setSavedList] = useState<SavedPrescription[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Trigger modal when parent checkout button signals Rx required and neither option is fulfilled
  useEffect(() => {
    if (
      openPickerSignal &&
      openPickerSignal > 0 &&
      !attachedPrescription &&
      prescriptionMode !== 'doctor_call'
    ) {
      setModalVisible(true);
    }
  }, [openPickerSignal, attachedPrescription, prescriptionMode]);

  const handlePickSource = useCallback(
    async (source: 'camera' | 'gallery') => {
      setModalVisible(false);
      setSavedModalVisible(false);

      // Brief delay to allow modal dismiss animation to complete smoothly on mobile
      await new Promise((resolve) => setTimeout(resolve, 250));

      try {
        const picked = await pickImageFromSource(
          source,
          t(
            'prescriptions.permissionRequired',
            'Camera and gallery permissions are needed to attach your prescription.',
          ),
        );
        if (!picked?.uri) return;

        setUploading(true);
        const saved = await savePrescription(picked.uri);
        onAttach(saved);
        onSelectMode?.('upload');
      } catch (err: any) {
        Alert.alert(
          t('common.error', 'Error'),
          err?.message ||
            t('prescriptions.uploadFailed', 'Failed to upload prescription. Please try again.'),
        );
      } finally {
        setUploading(false);
      }
    },
    [onAttach, onSelectMode, t],
  );

  const handleOpenSaved = useCallback(async () => {
    setModalVisible(false);
    setSavedModalVisible(true);
    setLoadingSaved(true);
    try {
      const items = await fetchPrescriptions({ force: true });
      setSavedList(items || []);
    } catch {
      setSavedList([]);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const handleSelectSaved = useCallback(
    (item: SavedPrescription) => {
      onAttach(item);
      onSelectMode?.('upload');
      setSavedModalVisible(false);
    },
    [onAttach, onSelectMode],
  );

  const handleSelectDoctorCall = useCallback(() => {
    setModalVisible(false);
    onAttach(null);
    onSelectMode?.('doctor_call');
  }, [onAttach, onSelectMode]);

  const handleSelectUploadOption = useCallback(() => {
    if (attachedPrescription) {
      onSelectMode?.('upload');
    } else {
      setModalVisible(true);
    }
  }, [attachedPrescription, onSelectMode]);

  const handleRemovePrescription = useCallback(() => {
    Alert.alert(
      t('cart.removeRxTitle', 'Remove Prescription?'),
      t(
        'cart.removeRxBody',
        'Are you sure you want to remove this prescription slip? You can upload another or choose our free doctor consultation call.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.remove', 'Remove'),
          style: 'destructive',
          onPress: () => {
            onAttach(null);
            onSelectMode?.(null);
          },
        },
      ],
    );
  }, [onAttach, onSelectMode, t]);

  if (!hasRxItems) {
    return null;
  }

  // Safe Android and iOS bottom inset padding for sheets
  const sheetBottomInset = Math.max(insets.bottom, 20) + (Platform.OS === 'android' ? 12 : 0);

  const isDoctorCall = prescriptionMode === 'doctor_call';
  const isUpload = prescriptionMode === 'upload' || Boolean(attachedPrescription);

  return (
    <View style={styles.container}>
      {/* Outer Card */}
      <View
        style={[
          styles.mainCard,
          isDoctorCall
            ? styles.cardBorderDoctor
            : isUpload
            ? styles.cardBorderSuccess
            : styles.cardBorderWarning,
        ]}
      >
        {/* Card Header */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.headerIconBadge,
              isDoctorCall
                ? styles.badgeDoctor
                : isUpload
                ? styles.badgeSuccess
                : styles.badgeWarning,
            ]}
          >
            <Ionicons
              name={isDoctorCall ? 'call' : isUpload ? 'checkmark-circle' : 'medical'}
              size={20}
              color={isDoctorCall ? '#0D9488' : isUpload ? '#059669' : '#DC2626'}
            />
          </View>
          <View style={styles.headerTextWrap}>
            <View style={styles.titleLine}>
              <Text style={styles.headerTitle}>
                {isDoctorCall
                  ? t('cart.doctorCallTitle', 'Doctor Call Consultation')
                  : isUpload
                  ? t('cart.rxAttachedTitle', 'Doctor Prescription Attached')
                  : t('cart.rxRequiredTitle', 'Prescription Required')}
              </Text>
              <View
                style={[
                  styles.statusTag,
                  isDoctorCall
                    ? styles.statusTagDoctor
                    : isUpload
                    ? styles.statusTagSuccess
                    : styles.statusTagWarning,
                ]}
              >
                <Text style={styles.statusTagText}>
                  {isDoctorCall
                    ? t('cart.rxTagFreeCall', 'Free Call')
                    : isUpload
                    ? t('cart.rxTagSlipReady', 'Slip Ready')
                    : t('cart.rxTagChoose1', 'Choose 1')}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {t(
                'cart.rxOptionsSubtitle',
                'Please select one option below to fulfill prescription requirement:',
              )}
            </Text>
          </View>
        </View>

        {uploading ? (
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={styles.uploadingText}>
              {t('cart.uploadingRx', 'Uploading and securing prescription…')}
            </Text>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            {/* ============================================================== */}
            {/* OPTION 1: UPLOAD PRESCRIPTION SLIP                             */}
            {/* ============================================================== */}
            <Pressable
              onPress={handleSelectUploadOption}
              style={({ pressed }) => [
                styles.optionRowCard,
                isUpload && styles.optionRowCardSelectedUpload,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isUpload }}
            >
              {/* Radio Indicator */}
              <View style={styles.radioCol}>
                <View style={[styles.radioOuter, isUpload && styles.radioOuterActiveUpload]}>
                  {isUpload ? <View style={styles.radioInnerUpload} /> : null}
                </View>
              </View>

              {/* Option Details */}
              <View style={styles.optionDetailsCol}>
                <View style={styles.optionTitleRow}>
                  <Text
                    style={[
                      styles.optionTitleText,
                      isUpload && { color: '#065F46', fontWeight: '800' },
                    ]}
                  >
                    {t('cart.option1Title', 'Option 1: Upload Prescription Slip')}
                  </Text>
                </View>

                <Text style={styles.optionDescription}>
                  {t(
                    'cart.option1Desc',
                    "Upload a photo of doctor's slip from your phone (Camera or Gallery)",
                  )}
                </Text>

                {/* If slip is attached */}
                {attachedPrescription ? (
                  <View style={styles.attachedPreviewRow}>
                    <Pressable
                      onPress={() => setPreviewVisible(true)}
                      style={({ pressed }) => [styles.thumbTouch, pressed && styles.pressed]}
                    >
                      <Image
                        source={{ uri: attachedPrescription.imageUrl }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                      <View style={styles.thumbZoomOverlay}>
                        <Ionicons name="scan-outline" size={13} color="#FFFFFF" />
                      </View>
                    </Pressable>

                    <View style={styles.attachedInfo}>
                      <View style={styles.attachedHeaderLine}>
                        <Text style={styles.attachedFileName}>
                          {t('cart.prescriptionSlip', 'Prescription Slip')}
                        </Text>
                        <View style={styles.readyPill}>
                          <Text style={styles.readyPillText}>
                            {t('cart.readyPill', 'Ready')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tapToPreview}>
                        {t('cart.tapToPreviewSlip', 'Tap image to preview')}
                      </Text>
                    </View>

                    <View style={styles.attachedActions}>
                      <Pressable
                        onPress={() => setModalVisible(true)}
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                      >
                        <Ionicons name="swap-horizontal" size={13} color="#1E293B" />
                        <Text style={styles.actionBtnText}>
                          {t('cart.changeSlip', 'Change')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleRemovePrescription}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          styles.removeBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons name="trash-outline" size={13} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* Action to upload */
                  <Pressable
                    onPress={() => setModalVisible(true)}
                    style={({ pressed }) => [styles.uploadCtaBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="cloud-upload-outline" size={15} color="#DC2626" />
                    <Text style={styles.uploadCtaText}>
                      {t('cart.uploadPhotoBtn', 'Upload Photo of Prescription')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Pressable>

            {/* ============================================================== */}
            {/* OPTION 2: DOCTOR WILL CALL YOU (1MG FREE TELECONSULTATION)     */}
            {/* ============================================================== */}
            <Pressable
              onPress={handleSelectDoctorCall}
              style={({ pressed }) => [
                styles.optionRowCard,
                isDoctorCall && styles.optionRowCardSelectedDoctor,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isDoctorCall }}
            >
              {/* Radio Indicator */}
              <View style={styles.radioCol}>
                <View style={[styles.radioOuter, isDoctorCall && styles.radioOuterActiveDoctor]}>
                  {isDoctorCall ? <View style={styles.radioInnerDoctor} /> : null}
                </View>
              </View>

              {/* Option Details */}
              <View style={styles.optionDetailsCol}>
                <View style={styles.optionTitleRow}>
                  <Text
                    style={[
                      styles.optionTitleText,
                      isDoctorCall && { color: '#0F766E', fontWeight: '800' },
                    ]}
                  >
                    {t('cart.option2Title', 'Option 2: Doctor Will Call You')}
                  </Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>
                      {t('cart.freeBadge100', '100% FREE')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.optionDescription}>
                  {t(
                    'cart.option2Desc',
                    "Don't have a paper prescription? Our certified doctor will call you to confirm your dosage & prescribe medicines for FREE.",
                  )}
                </Text>

                {/* Features highlight */}
                <View style={styles.doctorHighlightsRow}>
                  <View style={styles.highlightChip}>
                    <Ionicons name="checkmark-circle" size={13} color="#0D9488" />
                    <Text style={styles.highlightChipText}>
                      {t('cart.doctorChipNoSlip', 'No Paper Slip Needed')}
                    </Text>
                  </View>
                  <View style={styles.highlightChip}>
                    <Ionicons name="call" size={12} color="#0D9488" />
                    <Text style={styles.highlightChipText}>
                      {t('cart.doctorChipPhoneCall', 'Doctor Calls Your Phone')}
                    </Text>
                  </View>
                  <View style={styles.highlightChip}>
                    <Ionicons name="shield-checkmark" size={12} color="#0D9488" />
                    <Text style={styles.highlightChipText}>
                      {t('cart.doctorChipZeroCost', 'Zero Extra Cost')}
                    </Text>
                  </View>
                </View>

                {isDoctorCall ? (
                  <View style={styles.doctorSelectedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
                    <Text style={styles.doctorSelectedText}>
                      {t(
                        'cart.doctorSelectedText',
                        'Free Doctor Call Selected • Ready to continue',
                      )}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleSelectDoctorCall}
                    style={({ pressed }) => [styles.selectDoctorCtaBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="call-outline" size={14} color="#0F766E" />
                    <Text style={styles.selectDoctorCtaText}>
                      {t('cart.selectDoctorBtn', 'Select Free Doctor Call')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Upload Choice Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.sheetCard, { paddingBottom: sheetBottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTitleRow}>
                <View style={styles.sheetHeaderIconWrap}>
                  <Ionicons name="document-text" size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Upload Prescription</Text>
                  <Text style={styles.sheetSubtitle}>
                    Ensure doctor name and medicines are readable in the photo.
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeIconBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalOptionsScroll}
            >
              {/* Camera */}
              <Pressable
                onPress={() => void handlePickSource('camera')}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="camera" size={22} color="#DC2626" />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeadingRow}>
                    <Text style={styles.optionCardTitle}>{t('scan.camera', 'Take Photo')}</Text>
                    <View style={styles.instantBadge}>
                      <Text style={styles.instantBadgeText}>Instant</Text>
                    </View>
                  </View>
                  <Text style={styles.optionDesc}>
                    Click a clear photo of your paper prescription slip
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>

              {/* Gallery */}
              <Pressable
                onPress={() => void handlePickSource('gallery')}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="images" size={22} color="#4F46E5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionCardTitle}>{t('scan.gallery', 'Choose from Gallery')}</Text>
                  <Text style={styles.optionDesc}>
                    Upload saved photo or image from your device
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>

              {/* Saved Prescriptions */}
              <Pressable
                onPress={() => void handleOpenSaved()}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="folder-open" size={22} color="#059669" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionCardTitle}>Saved Prescriptions</Text>
                  <Text style={styles.optionDesc}>
                    Select from previously uploaded prescriptions in your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>

              {/* Don't have prescription -> Free Doctor Call */}
              <Pressable
                onPress={handleSelectDoctorCall}
                style={({ pressed }) => [
                  styles.optionCard,
                  styles.optionCardDoctorHighlighted,
                  pressed && styles.optionCardPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#CCFBF1' }]}>
                  <Ionicons name="call" size={22} color="#0F766E" />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeadingRow}>
                    <Text style={[styles.optionCardTitle, { color: '#115E59' }]}>
                      Don&apos;t have a prescription?
                    </Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>FREE CALL</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionDesc, { color: '#0F766E' }]}>
                    Our certified doctor will call you to confirm dosage & approve medicines.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0F766E" />
              </Pressable>

              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [styles.cancelSheetBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelSheetBtnText}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Saved Prescriptions Modal */}
      <Modal
        visible={savedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSavedModalVisible(false)}>
          <Pressable
            style={[styles.savedSheetCard, { paddingBottom: sheetBottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.savedSheetHeader}>
              <Pressable
                onPress={() => {
                  setSavedModalVisible(false);
                  setModalVisible(true);
                }}
                style={styles.backButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>

              <Text style={styles.savedSheetTitle}>Saved Prescriptions</Text>

              <Pressable
                onPress={() => setSavedModalVisible(false)}
                style={styles.closeIconBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {loadingSaved ? (
              <View style={styles.savedLoading}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={styles.savedLoadingText}>Loading your prescriptions…</Text>
              </View>
            ) : savedList.length === 0 ? (
              <View style={styles.savedEmpty}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={38} color="#94A3B8" />
                </View>
                <Text style={styles.savedEmptyTitle}>No saved prescriptions found</Text>
                <Text style={styles.savedEmptyDesc}>
                  You do not have any saved prescriptions in your account yet. Choose an option to add one:
                </Text>

                <View style={styles.emptyActionsRow}>
                  <Pressable
                    onPress={() => void handlePickSource('camera')}
                    style={styles.emptyActionBtn}
                  >
                    <Ionicons name="camera" size={16} color="#DC2626" />
                    <Text style={styles.emptyActionBtnText}>Take Photo</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void handlePickSource('gallery')}
                    style={[styles.emptyActionBtn, styles.emptyActionBtnSecondary]}
                  >
                    <Ionicons name="images" size={16} color="#4F46E5" />
                    <Text style={[styles.emptyActionBtnText, { color: '#4F46E5' }]}>
                      From Gallery
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.savedScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.savedListHelper}>
                  Tap any prescription below to attach it to this cart:
                </Text>
                {savedList.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectSaved(item)}
                    style={({ pressed }) => [styles.savedItemRow, pressed && styles.optionCardPressed]}
                    accessibilityRole="button"
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.savedThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.savedItemInfo}>
                      <Text style={styles.savedItemTitle}>Prescription Slip</Text>
                      <Text style={styles.savedItemDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.savedItemHint}>Tap to attach to order</Text>
                    </View>
                    <View style={styles.selectRxBtn}>
                      <Text style={styles.selectRxBtnText}>Select</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full Size Image Preview Modal */}
      <ImagePreviewModal
        uri={attachedPrescription?.imageUrl ?? null}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        closeLabel={t('common.close', 'Close')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mainCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardBorderWarning: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  cardBorderSuccess: {
    borderColor: '#86EFAC',
    backgroundColor: '#F8FDF9',
  },
  cardBorderDoctor: {
    borderColor: '#99F6E4',
    backgroundColor: '#F9FEFD',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWarning: {
    backgroundColor: '#FEE2E2',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeDoctor: {
    backgroundColor: '#CCFBF1',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  headerTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: moderateScale(13.5, 0.35),
    color: colors.textPrimary,
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagWarning: {
    backgroundColor: '#DC2626',
  },
  statusTagSuccess: {
    backgroundColor: '#059669',
  },
  statusTagDoctor: {
    backgroundColor: '#0D9488',
  },
  statusTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  optionsContainer: {
    gap: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  optionRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  optionRowCardSelectedUpload: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  optionRowCardSelectedDoctor: {
    borderColor: '#14B8A6',
    backgroundColor: '#F0FDFA',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  radioCol: {
    paddingTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterActiveUpload: {
    borderColor: '#059669',
  },
  radioOuterActiveDoctor: {
    borderColor: '#0D9488',
  },
  radioInnerUpload: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  radioInnerDoctor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  optionDetailsCol: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  optionTitleText: {
    fontSize: moderateScale(13.5, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    minWidth: moderateScale(120, 0.35),
  },
  freeBadge: {
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#14B8A6',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#0F766E',
    fontSize: 9.5,
    fontWeight: '800',
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  uploadCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  uploadCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  selectDoctorCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  selectDoctorCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  doctorHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#99F6E4',
    maxWidth: '100%',
  },
  highlightChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0F766E',
    flexShrink: 1,
  },
  doctorSelectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  doctorSelectedText: {
    fontSize: moderateScale(11.5, 0.35),
    fontWeight: '800',
    color: '#0F766E',
    flex: 1,
    flexShrink: 1,
    lineHeight: 16,
  },
  attachedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: '#FFFFFF',
    padding: spacing.xs + 3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: spacing.xs + 2,
    overflow: 'hidden',
  },
  thumbTouch: {
    position: 'relative',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  thumbZoomOverlay: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 3,
    padding: 1.5,
  },
  attachedInfo: {
    flex: 1,
    minWidth: 0,
  },
  attachedHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachedFileName: {
    fontSize: moderateScale(12, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  readyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  readyPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  tapToPreview: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  attachedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  removeBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  uploadingText: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: Platform.OS === 'android' ? '90%' : '85%',
    ...shadows.lg,
  },
  savedSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: Platform.OS === 'android' ? '90%' : '85%',
    ...shadows.lg,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  sheetHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sheetTitle: {
    ...typography.h3,
    fontSize: moderateScale(17, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: spacing.sm,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionsScroll: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
  },
  optionCardDoctorHighlighted: {
    borderColor: '#5EEAD4',
    backgroundColor: '#F0FDFA',
  },
  optionCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    transform: [{ scale: 0.99 }],
  },
  optionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  optionCardTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: moderateScale(14, 0.35),
    color: colors.textPrimary,
  },
  instantBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  instantBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  optionDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  cancelSheetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  cancelSheetBtnText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  savedSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedSheetTitle: {
    ...typography.h3,
    fontSize: moderateScale(16, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  savedLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedLoadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  savedEmpty: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  savedEmptyTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: 15,
    color: colors.textPrimary,
  },
  savedEmptyDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  emptyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  emptyActionBtnSecondary: {
    backgroundColor: '#EEF2FF',
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  savedScroll: {
    marginTop: spacing.sm,
  },
  savedListHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  savedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
    gap: spacing.sm + 2,
  },
  savedThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  savedItemDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  savedItemHint: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  selectRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  selectRxBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  pressed: {
    opacity: 0.8,
  },
});

export default CartPrescriptionCard;
