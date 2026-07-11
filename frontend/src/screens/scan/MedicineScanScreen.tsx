import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
  StatusBar,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import theme from '@/styles/theme';
import { pickImageFromSource, type PickedImage } from '@/utils/imagePicker';
import type { AuthScreenProps } from '@/navigation/types';
import { scanPrescription, savePrescription } from '@/services/prescriptionService';
import type { ScannedMedicine, ImageType } from '@/types/prescription';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const PAGE_BG = '#F5F6F8';
const ACCENT = colors.primary;
const ACCENT_DARK = colors.primaryDark;
const PERMISSION_MESSAGE =
  'Allow camera or photo access to upload your prescription.';

const SCAN_TIPS = [
  { icon: 'sunny-outline' as const, label: 'Good light', desc: 'Avoid shadows' },
  { icon: 'scan-outline' as const, label: 'Full frame', desc: 'Capture all text' },
  { icon: 'document-text' as const, label: 'Doctor sign', desc: 'Must be visible' },
];

const SCAN_STEPS = [
  { key: 'upload', label: 'Upload', icon: 'cloud-upload-outline' as const },
  { key: 'scan', label: 'Scan', icon: 'scan-outline' as const },
  { key: 'results', label: 'Results', icon: 'list-outline' as const },
];

const FEATURE_HIGHLIGHTS = [
  { icon: 'sparkles' as const, title: 'AI Detection', subtitle: 'Smart read', tint: ACCENT, bg: colors.infoLight },
  { icon: 'create-outline' as const, title: 'Auto-correct', subtitle: 'Fix typos', tint: colors.warning, bg: colors.warningLight },
  { icon: 'flash-outline' as const, title: 'Instant', subtitle: 'Seconds', tint: colors.secondary, bg: '#CCFBF1' },
];

const SCAN_BEAM_DURATION_MS = 2800;
const SCAN_ZONE_INSET = moderateScale(24);

const CornerBracket = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const bracketStyle = [
    styles.bracket,
    position === 'tl' && styles.bracketTL,
    position === 'tr' && styles.bracketTR,
    position === 'bl' && styles.bracketBL,
    position === 'br' && styles.bracketBR,
  ];

  return <View style={bracketStyle} />;
};

type StepState = 'complete' | 'active' | 'pending';

interface StepIndicatorProps {
  hasImage: boolean;
  isScanning: boolean;
  hasResults: boolean;
}

const StepIndicator = ({ hasImage, isScanning, hasResults }: StepIndicatorProps) => {
  const getStepState = (index: number): StepState => {
    if (index === 0) return hasImage ? 'complete' : 'active';
    if (index === 1) {
      if (hasResults) return 'complete';
      if (hasImage || isScanning) return 'active';
      return 'pending';
    }
    return hasResults ? 'active' : 'pending';
  };

  const isConnectorActive = (index: number) => {
    if (index === 0) return hasImage;
    if (index === 1) return hasResults;
    return false;
  };

  return (
    <View style={styles.stepRow}>
      {SCAN_STEPS.map((step, index) => {
        const state = getStepState(index);
        const isLast = index === SCAN_STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  state === 'complete' && styles.stepCircleComplete,
                  state === 'active' && styles.stepCircleActive,
                ]}
              >
                {state === 'complete' ? (
                  <Ionicons name="checkmark" size={13} color={colors.white} />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={13}
                    color={state === 'active' ? colors.white : colors.textMuted}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  state === 'active' && styles.stepLabelActive,
                  state === 'complete' && styles.stepLabelComplete,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {!isLast ? (
              <View
                style={[
                  styles.stepConnector,
                  isConnectorActive(index) && styles.stepConnectorActive,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

interface ScanBeamOverlayProps {
  active: boolean;
  insetX?: number;
}

const ScanBeamOverlay = ({ active, insetX = SCAN_ZONE_INSET }: ScanBeamOverlayProps) => {
  const scanProgress = useSharedValue(0);
  const zoneHeight = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scanProgress);
      scanProgress.value = 0;
      return;
    }

    scanProgress.value = 0;
    scanProgress.value = withRepeat(
      withTiming(1, {
        duration: SCAN_BEAM_DURATION_MS,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(scanProgress);
    };
  }, [active, scanProgress]);

  const handleZoneLayout = useCallback(
    (event: LayoutChangeEvent) => {
      zoneHeight.value = event.nativeEvent.layout.height;
    },
    [zoneHeight],
  );

  const beamStyle = useAnimatedStyle(() => {
    const height = zoneHeight.value;
    if (height <= 0) {
      return { opacity: 0, transform: [{ translateY: 0 }] };
    }

    const travelRange = Math.max(height - insetX * 2, 1);
    const translateY = insetX + scanProgress.value * travelRange;
    const opacity = interpolate(
      scanProgress.value,
      [0, 0.04, 0.96, 1],
      [0.25, 1, 1, 0.25],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const trailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanProgress.value, [0, 0.5, 1], [0.55, 0.35, 0.2], Extrapolation.CLAMP),
  }));

  if (!active) {
    return null;
  }

  return (
    <View style={styles.scanOverlay} onLayout={handleZoneLayout} pointerEvents="none">
      <Animated.View style={[styles.scanBeamWrap, { left: insetX, right: insetX }, beamStyle]}>
        <LinearGradient
          colors={['rgba(26,115,232,0)', 'rgba(26,115,232,0.95)', 'rgba(26,115,232,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.scanBeamLine}
        />
        <Animated.View style={[styles.scanBeamTrailWrap, trailStyle]}>
          <LinearGradient
            colors={['rgba(26,115,232,0.42)', 'rgba(26,115,232,0.14)', 'rgba(26,115,232,0)']}
            style={styles.scanBeamTrail}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const MedicineScanScreen = ({ navigation }: AuthScreenProps<'MedicineScan'>) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const previewHeight = Math.min(screenWidth - spacing.xl * 2, moderateScale(300));

  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [medicines, setMedicines] = useState<ScannedMedicine[]>([]);
  const [imageType, setImageType] = useState<ImageType>('prescription');
  const [scanError, setScanError] = useState<string | null>(null);

  const bracketPulse = useSharedValue(0.72);

  useEffect(() => {
    bracketPulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(bracketPulse);
    };
  }, [bracketPulse]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const bracketGlowStyle = useAnimatedStyle(() => ({
    opacity: bracketPulse.value,
  }));

  const canScan = Boolean(pickedImage) && !isScanning && !isPicking && !isSaving;
  const canSave =
    Boolean(pickedImage) && hasScanned && !isScanning && !isPicking && !isSaving && !isSaved;

  const handlePick = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (isPicking || isScanning || isSaving) return;

      setIsPicking(true);
      setMedicines([]);
      setScanError(null);
      setHasScanned(false);
      setIsSaved(false);

      try {
        const image = await pickImageFromSource(source, PERMISSION_MESSAGE);
        if (!mountedRef.current) return;
        if (image) {
          setPickedImage(image);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } finally {
        if (mountedRef.current) setIsPicking(false);
      }
    },
    [isPicking, isScanning, isSaving],
  );

  const handleClearImage = useCallback(() => {
    setPickedImage(null);
    setMedicines([]);
    setScanError(null);
    setImageType('prescription');
    setHasScanned(false);
    setIsSaved(false);
  }, []);

  const handleScan = useCallback(async () => {
    if (!pickedImage || isScanning || isSaving) return;

    setIsScanning(true);
    setMedicines([]);
    setScanError(null);
    setHasScanned(false);
    setIsSaved(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await scanPrescription(pickedImage.uri);
      if (!mountedRef.current) return;
      setMedicines(result.medicines || []);
      setImageType(result.imageType || 'prescription');
      setHasScanned(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (!mountedRef.current) return;
      const errorMessage = error?.message || 'Failed to scan image';
      setScanError(errorMessage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (mountedRef.current) setIsScanning(false);
    }
  }, [isScanning, isSaving, pickedImage]);

  const handleSave = useCallback(async () => {
    if (!pickedImage || !canSave) return;

    setIsSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await savePrescription(pickedImage.uri);
      if (!mountedRef.current) return;
      setIsSaved(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Prescription photo saved to your account.', [
        { text: 'OK', style: 'cancel' },
        {
          text: 'View prescriptions',
          onPress: () => navigation.navigate('Prescriptions'),
        },
      ]);
    } catch (error: any) {
      if (!mountedRef.current) return;
      const errorMessage = error?.message || 'Failed to save prescription';
      Alert.alert('Save failed', errorMessage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [canSave, navigation, pickedImage]);

  const handleReplace = useCallback(() => {
    Alert.alert('Replace photo?', 'Choose a new prescription or medicine photo.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => void handlePick('camera') },
      { text: 'Gallery', onPress: () => void handlePick('gallery') },
    ]);
  }, [handlePick]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={Platform.OS === 'android'} />

      <LinearGradient
        colors={['#E8F1FE', '#F0F5FF', PAGE_BG]}
        locations={[0, 0.35, 0.65]}
        style={styles.pageGradient}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle}>Scan Medicine</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={ACCENT} />
              <Text style={styles.aiBadgeText}>AI Powered</Text>
            </View>
          </View>
          <Pressable
            onPress={handleClearImage}
            disabled={!pickedImage}
            style={({ pressed }) => [
              styles.clearBtn,
              !pickedImage && styles.clearBtnDisabled,
              pressed && pickedImage && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={pickedImage ? colors.error : colors.textMuted}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + moderateScale(128) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroBlock}>
          {/* <View style={styles.heroIconRow}>
            <LinearGradient
              colors={[colors.infoLight, '#E0EDFF']}
              style={styles.heroIcon}
            >
              <Ionicons name="document-text-outline" size={18} color={ACCENT} />
            </LinearGradient>
            <LinearGradient
              colors={['#CCFBF1', '#E6FFFA']}
              style={styles.heroIcon}
            >
              <Ionicons name="medkit-outline" size={18} color={colors.secondary} />
            </LinearGradient>
            <View style={styles.heroIconDivider} />
            <Text style={styles.heroTagline}>Prescription · Medicine pack · Strip</Text>
          </View> */}
          
          <Text style={styles.heroTitle}>
            Scan medicines{' '}
            <Text style={styles.heroTitleAccent}>instantly</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Upload a prescription or medicine photo. Our AI identifies exact names, corrects mistakes, and shows full details.
          </Text>

          <View style={styles.featureRow}>
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <View key={feature.title} style={[styles.featureCard, { backgroundColor: feature.bg }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.white }]}>
                  <Ionicons name={feature.icon} size={16} color={feature.tint} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(80).duration(350)}>
          <StepIndicator
            hasImage={Boolean(pickedImage)}
            isScanning={isScanning}
            hasResults={medicines.length > 0}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100).duration(350)}>
          <LinearGradient
            colors={pickedImage ? [ACCENT, colors.secondary] : ['#CBD5E1', '#E2E8F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCardBorder}
          >
            <View style={styles.previewCard}>
          <Pressable
            onPress={() => {
              if (!pickedImage) void handlePick('camera');
              else handleReplace();
            }}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={pickedImage ? 'Replace photo' : 'Add photo'}
          >
            <View style={[styles.previewFrame, { height: previewHeight }]}>
              {pickedImage ? (
                <>
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={styles.previewImage}
                    contentFit="cover"
                    transition={220}
                  />
                  {isScanning ? (
                    <View style={styles.scanningOverlay}>
                      <ScanBeamOverlay active />
                      <View style={styles.scanningStatus}>
                        <View style={styles.scanningDot} />
                        <Text style={styles.scanningStatusText}>Analyzing image...</Text>
                      </View>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['transparent', 'rgba(15,23,42,0.72)']}
                      style={styles.previewGradient}
                    >
                      <View style={styles.readyPill}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={styles.readyPillText}>Ready to scan</Text>
                      </View>
                    </LinearGradient>
                  )}
                </>
              ) : (
                <View style={styles.emptyWrap}>
                  <Animated.View style={[styles.bracketGlow, bracketGlowStyle]}>
                    <CornerBracket position="tl" />
                    <CornerBracket position="tr" />
                    <CornerBracket position="bl" />
                    <CornerBracket position="br" />
                  </Animated.View>
                  <ScanBeamOverlay active />
                  <View style={styles.emptyIcon}>
                    <LinearGradient
                      colors={[colors.infoLight, '#E0EDFF']}
                      style={styles.emptyIconGradient}
                    >
                      <Ionicons name="scan-outline" size={moderateScale(36)} color={ACCENT} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyTitle}>Tap to add photo</Text>
                  <Text style={styles.emptySubtitle}>
                    Use camera or gallery below to upload your prescription
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <View style={styles.sourceRow}>
            <Pressable
              style={({ pressed }) => [
                styles.sourceBtn,
                pressed && styles.pressed,
                (isPicking || isScanning) && styles.sourceBtnDisabled,
              ]}
              onPress={() => void handlePick('camera')}
              disabled={isPicking || isScanning}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sourceBtnGradient}
              >
                <View style={styles.sourceIconCircle}>
                  <Ionicons name="camera" size={18} color={colors.white} />
                </View>
                <Text style={styles.sourceBtnPrimaryText}>Camera</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sourceBtn,
                styles.sourceBtnSecondary,
                pressed && styles.pressed,
                (isPicking || isScanning) && styles.sourceBtnDisabled,
              ]}
              onPress={() => void handlePick('gallery')}
              disabled={isPicking || isScanning}
            >
              <View style={[styles.sourceIconCircle, styles.sourceIconCircleAlt]}>
                <Ionicons name="images-outline" size={18} color={ACCENT} />
              </View>
              <Text style={styles.sourceBtnSecondaryText}>Gallery</Text>
            </Pressable>
          </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(400)} style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsHeaderIcon}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            </View>
            <Text style={styles.tipsHeaderText}>Pro tips for best results</Text>
          </View>
          <View style={styles.tipsRow}>
            {SCAN_TIPS.map((tip) => (
              <View key={tip.label} style={styles.tipChip}>
                <View style={styles.tipIconWrap}>
                  <Ionicons name={tip.icon} size={14} color={ACCENT} />
                </View>
                <Text style={styles.tipChipText}>{tip.label}</Text>
                <Text style={styles.tipChipDesc}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {medicines.length > 0 && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.medicineBox}>
            <LinearGradient
              colors={[colors.successLight, colors.white]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.medicineBoxGradient}
            >
            <View style={styles.medicineHeader}>
              <View style={styles.medicineHeaderLeft}>
                <Ionicons name="medical" size={20} color={colors.success} />
                <Text style={styles.medicineTitle}>
                  {imageType === 'prescription'
                    ? 'Medicines detected'
                    : imageType === 'medicine_pack' || imageType === 'medicine_strip' || imageType === 'medicine_bottle'
                      ? 'Medicine identified'
                      : 'Medicines detected'}
                </Text>
              </View>
              <View style={styles.medicineBadge}>
                <Text style={styles.medicineBadgeText}>{medicines.length}</Text>
              </View>
            </View>

            <View style={styles.medicineList}>
              {medicines.map((med, index) => (
                <View key={index} style={styles.medicineCard}>
                  <View style={styles.medicineCardTop}>
                    <View style={styles.medicineNumber}>
                      <Text style={styles.medicineNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.medicineCardInfo}>
                      <Text style={styles.medicineName}>{med.correctedName}</Text>

                      {med.hasSpellingError && med.detectedName !== med.correctedName && (
                        <View style={styles.correctionRow}>
                          <Ionicons name="sparkles" size={12} color={colors.warning} />
                          <Text style={styles.correctionText}>
                            Detected as "<Text style={styles.correctionStrike}>{med.detectedName}</Text>" — auto-corrected
                          </Text>
                        </View>
                      )}

                      {med.genericName ? (
                        <View style={styles.genericRow}>
                          <Ionicons name="flask-outline" size={12} color={colors.textMuted} />
                          <Text style={styles.genericText}>{med.genericName}</Text>
                        </View>
                      ) : null}

                      <View style={styles.tagRow}>
                        {med.brandName ? (
                          <View style={styles.brandTag}>
                            <Text style={styles.brandTagText}>{med.brandName}</Text>
                          </View>
                        ) : null}
                        {med.form ? (
                          <View style={styles.formTag}>
                            <Text style={styles.formTagText}>{med.form}</Text>
                          </View>
                        ) : null}
                        {med.manufacturer ? (
                          <View style={styles.mfgTag}>
                            <Text style={styles.mfgTagText}>{med.manufacturer}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.medicineFooter}>
              AI-powered detection — please verify with your pharmacist before use.
            </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {hasScanned && !isSaved && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.saveHintCard}>
            <Ionicons name="cloud-upload-outline" size={18} color={ACCENT} />
            <Text style={styles.saveHintText}>
              Happy with this photo? Save it to your prescriptions.
            </Text>
          </Animated.View>
        )}

        {scanError && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
            </View>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Scan failed</Text>
              <Text style={styles.errorBody}>{scanError}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {canSave ? (
          <View style={styles.footerHint}>
            <Ionicons name="cloud-upload-outline" size={14} color={ACCENT} />
            <Text style={[styles.footerHintText, { color: ACCENT }]}>
              Ready to save this prescription photo
            </Text>
          </View>
        ) : canScan && !hasScanned ? (
          <View style={styles.footerHint}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.footerHintText}>Photo ready — tap below to scan</Text>
          </View>
        ) : isSaved ? (
          <View style={styles.footerHint}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.footerHintText}>Prescription saved</Text>
          </View>
        ) : null}

        {hasScanned ? (
          <View style={styles.footerActions}>
            <Pressable
              onPress={() => void handleScan()}
              disabled={!canScan || isSaving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && canScan && styles.pressed,
                (!canScan || isSaving) && styles.scanBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
            >
              <Ionicons name="scan" size={18} color={ACCENT} />
              <Text style={styles.secondaryBtnText}>{isScanning ? 'Analyzing...' : 'Rescan'}</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleSave()}
              disabled={!canSave && !isSaved}
              style={({ pressed }) => [
                styles.scanBtn,
                styles.saveBtnFlex,
                (canSave || isSaved) && styles.scanBtnReady,
                !canSave && !isSaved && styles.scanBtnDisabled,
                pressed && canSave && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save prescription"
            >
              <LinearGradient
                colors={
                  isSaved
                    ? [colors.success, '#15803D']
                    : canSave
                      ? [ACCENT, ACCENT_DARK]
                      : ['#CBD5E1', '#94A3B8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanBtnInner}
              >
                <View style={styles.scanBtnIconWrap}>
                  <Ionicons
                    name={isSaved ? 'checkmark' : 'cloud-upload-outline'}
                    size={20}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.scanBtnText}>
                  {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save prescription'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => void handleScan()}
            disabled={!canScan}
            style={({ pressed }) => [
              styles.scanBtn,
              canScan && styles.scanBtnReady,
              !canScan && styles.scanBtnDisabled,
              pressed && canScan && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Scan photo"
          >
            <LinearGradient
              colors={canScan ? [ACCENT, ACCENT_DARK] : ['#CBD5E1', '#94A3B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanBtnInner}
            >
              <View style={styles.scanBtnIconWrap}>
                <Ionicons name="scan" size={20} color={colors.white} />
              </View>
              <Text style={styles.scanBtnText}>{isScanning ? 'Analyzing...' : 'Tap to Scan'}</Text>
              {canScan && !isScanning ? (
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.85)" />
              ) : null}
            </LinearGradient>
          </Pressable>
        )}
      </View>

    </View>
  );
};

const BRACKET = moderateScale(22);
const BRACKET_THICK = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  pageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeTop: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  topTitleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(26,115,232,0.15)',
  },
  aiBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.3,
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: PAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnDisabled: {
    backgroundColor: PAGE_BG,
  },
  topTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  heroBlock: {
    marginBottom: spacing.md,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroIconDivider: {
    width: 1,
    height: moderateScale(20),
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  heroTagline: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
    minWidth: moderateScale(140),
  },
  heroTitle: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    lineHeight: moderateScale(32),
  },
  heroTitleAccent: {
    color: ACCENT,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: moderateScale(22),
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...shadows.sm,
  },
  featureIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  featureTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  stepItem: {
    alignItems: 'center',
    width: moderateScale(68),
  },
  stepCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  stepCircleActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepCircleComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: ACCENT,
    fontWeight: '800',
  },
  stepLabelComplete: {
    color: colors.success,
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: moderateScale(15),
    marginHorizontal: -spacing.xs,
    borderRadius: 1,
  },
  stepConnectorActive: {
    backgroundColor: colors.success,
  },
  previewCardBorder: {
    borderRadius: borderRadius.xxl + 2,
    padding: 2,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
  },
  previewFrame: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: PAGE_BG,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  readyPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  bracketGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanBeamWrap: {
    position: 'absolute',
    top: 0,
  },
  scanBeamLine: {
    height: 2,
    borderRadius: 1,
  },
  scanBeamTrailWrap: {
    marginTop: -1,
  },
  scanBeamTrail: {
    height: moderateScale(56),
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.38)',
    overflow: 'hidden',
  },
  scanningStatus: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  scanningStatusText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: ACCENT,
  },
  bracketTL: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: BRACKET_THICK,
    borderLeftWidth: BRACKET_THICK,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: BRACKET_THICK,
    borderRightWidth: BRACKET_THICK,
    borderTopRightRadius: 8,
  },
  bracketBL: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: BRACKET_THICK,
    borderLeftWidth: BRACKET_THICK,
    borderBottomLeftRadius: 8,
  },
  bracketBR: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: BRACKET_THICK,
    borderRightWidth: BRACKET_THICK,
    borderBottomRightRadius: 8,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyIconGradient: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sourceBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minHeight: moderateScale(50),
  },
  sourceBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(50),
    paddingHorizontal: spacing.md,
  },
  sourceIconCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIconCircleAlt: {
    backgroundColor: colors.infoLight,
  },
  sourceBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  sourceBtnDisabled: {
    opacity: 0.65,
  },
  sourceBtnPrimaryText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.white,
  },
  sourceBtnSecondaryText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: ACCENT,
  },
  tipsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsHeaderIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsHeaderText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: PAGE_BG,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tipIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tipChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  tipChipDesc: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  medicineBox: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.successLight,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  medicineBoxGradient: {
    padding: spacing.lg,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  medicineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicineTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  medicineBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: moderateScale(28),
    alignItems: 'center',
  },
  medicineBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.success,
  },
  medicineList: {
    gap: spacing.md,
  },
  medicineCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    ...shadows.sm,
  },
  medicineCardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  medicineCardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  correctionText: {
    fontSize: moderateScale(11),
    color: '#B45309',
    fontWeight: '500',
    flex: 1,
  },
  correctionStrike: {
    textDecorationLine: 'line-through',
    color: '#DC2626',
  },
  genericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genericText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  brandTag: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  brandTagText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: ACCENT,
  },
  formTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  formTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: colors.success,
  },
  mfgTag: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  mfgTagText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#7C3AED',
  },
  medicineNumber: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineNumberText: {
    ...typography.caption,
    fontWeight: '800',
    color: ACCENT,
  },
  medicineName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  medicineFooter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.errorLight,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  errorIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: moderateScale(18),
  },
  resultCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.successLight,
    ...shadows.sm,
  },
  resultIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resultBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: moderateScale(18),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    ...shadows.lg,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footerHintText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.success,
  },
  scanBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  scanBtnReady: {
    ...shadows.lg,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  scanBtnDisabled: {
    opacity: 0.85,
    ...shadows.sm,
  },
  scanBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(56),
    paddingHorizontal: spacing.xl,
  },
  scanBtnIconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    ...typography.button,
    color: colors.white,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: moderateScale(56),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    ...typography.button,
    color: ACCENT,
    fontSize: moderateScale(14),
  },
  saveBtnFlex: {
    flex: 1,
  },
  saveHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  saveHintText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: moderateScale(18),
  },
});

export default MedicineScanScreen;
