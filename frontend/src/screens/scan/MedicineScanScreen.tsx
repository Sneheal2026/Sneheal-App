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
import { ScannedMedicineCard } from '@/components/scan';
import { useTranslation } from 'react-i18next';

const { spacing, typography, borderRadius, moderateScale } = theme;

/** Unique palette for the scan screen — independent of app-wide brand colors. */
const SCAN = {
  page: '#F4F0FF',
  ink: '#1B1238',
  inkSoft: '#4A3B6E',
  muted: '#8B7AA8',
  surface: '#FFFFFF',
  violet: '#7C3AED',
  violetDeep: '#5B21B6',
  violetSoft: '#EDE9FE',
  cyan: '#06B6D4',
  cyanDeep: '#0E7490',
  cyanSoft: '#CFFAFE',
  rose: '#F43F5E',
  roseDeep: '#BE123C',
  roseSoft: '#FFE4E6',
  mint: '#059669',
  mintDeep: '#047857',
  mintSoft: '#D1FAE5',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  scanner: '#120B24',
  scannerMid: '#1C1436',
  white: '#FFFFFF',
  error: '#E11D48',
  errorSoft: '#FFE4E6',
} as const;

const SCAN_TIPS = [
  { icon: 'sunny-outline' as const, labelKey: 'scan.tipGoodLight', descKey: 'scan.tipGoodLightDesc', tint: SCAN.amber, bg: SCAN.amberSoft },
  { icon: 'scan-outline' as const, labelKey: 'scan.tipFullFrame', descKey: 'scan.tipFullFrameDesc', tint: SCAN.violet, bg: SCAN.violetSoft },
  { icon: 'document-text' as const, labelKey: 'scan.tipDoctorSign', descKey: 'scan.tipDoctorSignDesc', tint: SCAN.cyanDeep, bg: SCAN.cyanSoft },
];

const SCAN_STEPS = [
  { key: 'upload', labelKey: 'scan.stepUpload', icon: 'cloud-upload-outline' as const },
  { key: 'scan', labelKey: 'scan.stepScan', icon: 'scan-outline' as const },
  { key: 'results', labelKey: 'scan.stepResults', icon: 'list-outline' as const },
];

const FEATURE_HIGHLIGHTS = [
  { icon: 'sparkles' as const, titleKey: 'scan.featureAiDetection', subtitleKey: 'scan.featureAiDetectionSub', tint: SCAN.violet, bg: SCAN.violetSoft },
  { icon: 'create-outline' as const, titleKey: 'scan.featureAutoCorrect', subtitleKey: 'scan.featureAutoCorrectSub', tint: SCAN.rose, bg: SCAN.roseSoft },
  { icon: 'flash-outline' as const, titleKey: 'scan.featureInstant', subtitleKey: 'scan.featureInstantSub', tint: SCAN.cyanDeep, bg: SCAN.cyanSoft },
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
  const { t } = useTranslation();
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
              <LinearGradient
                colors={
                  state === 'complete'
                    ? [SCAN.mint, SCAN.mintDeep]
                    : state === 'active'
                      ? [SCAN.violet, SCAN.cyan]
                      : [SCAN.surface, SCAN.violetSoft]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.stepCircle,
                  state === 'pending' && styles.stepCirclePending,
                ]}
              >
                {state === 'complete' ? (
                  <Ionicons name="checkmark" size={13} color={SCAN.white} />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={13}
                    color={state === 'active' ? SCAN.white : SCAN.muted}
                  />
                )}
              </LinearGradient>
              <Text
                style={[
                  styles.stepLabel,
                  state === 'active' && styles.stepLabelActive,
                  state === 'complete' && styles.stepLabelComplete,
                ]}
              >
                {t(step.labelKey)}
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
          colors={['rgba(6,182,212,0)', 'rgba(196,181,253,0.95)', 'rgba(6,182,212,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.scanBeamLine}
        />
        <Animated.View style={[styles.scanBeamTrailWrap, trailStyle]}>
          <LinearGradient
            colors={['rgba(124,58,237,0.45)', 'rgba(6,182,212,0.16)', 'rgba(6,182,212,0)']}
            style={styles.scanBeamTrail}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const MedicineScanScreen = ({ navigation }: AuthScreenProps<'MedicineScan'>) => {
  const { t } = useTranslation();
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
        const image = await pickImageFromSource(source, t('scan.permissionMessage'));
        if (!mountedRef.current) return;
        if (image) {
          setPickedImage(image);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } finally {
        if (mountedRef.current) setIsPicking(false);
      }
    },
    [isPicking, isScanning, isSaving, t],
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
      Alert.alert(t('scan.savedTitle'), t('scan.savedBody'), [
        { text: t('scan.ok'), style: 'cancel' },
        {
          text: t('scan.viewPrescriptions'),
          onPress: () => navigation.navigate('Prescriptions'),
        },
      ]);
    } catch (error: any) {
      if (!mountedRef.current) return;
      const errorMessage = error?.message || 'Failed to save prescription';
      Alert.alert(t('scan.saveFailedTitle'), errorMessage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [canSave, navigation, pickedImage, t]);

  const handleReplace = useCallback(() => {
    Alert.alert(t('scan.replacePhotoTitle'), t('scan.replacePhotoBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('scan.camera'), onPress: () => void handlePick('camera') },
      { text: t('scan.gallery'), onPress: () => void handlePick('gallery') },
    ]);
  }, [handlePick, t]);

  const handleSearchMedicine = useCallback(
    (query: string) => {
      const term = query.trim();
      if (!term) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('Main', {
        screen: 'Search',
        params: { query: term, autofocus: true },
      });
    },
    [navigation],
  );

  const sourcesDisabled = isPicking || isScanning;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={Platform.OS === 'android'} />

      <View style={styles.atmosphere} pointerEvents="none">
        <LinearGradient
          colors={['#E9D5FF', '#F4F0FF', '#ECFEFF']}
          locations={[0, 0.42, 1]}
          style={styles.pageGradient}
        />
        <View style={styles.orbViolet} />
        <View style={styles.orbCyan} />
        <View style={styles.orbRose} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={SCAN.ink} />
          </Pressable>
          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle}>{t('scan.title')}</Text>
            <LinearGradient
              colors={[SCAN.violetSoft, SCAN.cyanSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiBadge}
            >
              <Ionicons name="sparkles" size={10} color={SCAN.violet} />
              <Text style={styles.aiBadgeText}>{t('scan.aiPowered')}</Text>
            </LinearGradient>
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
              color={pickedImage ? SCAN.rose : SCAN.muted}
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
          <Text style={styles.heroTitle}>
            {t('scan.heroTitle')}{' '}
            <Text style={styles.heroTitleAccent}>{t('scan.heroTitleAccent')}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{t('scan.heroSubtitle')}</Text>

          <View style={styles.featureRow}>
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <View key={feature.titleKey} style={[styles.featureCard, { backgroundColor: feature.bg }]}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon} size={16} color={feature.tint} />
                </View>
                <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                <Text style={styles.featureSubtitle}>{t(feature.subtitleKey)}</Text>
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
            colors={pickedImage ? [SCAN.violet, SCAN.cyan] : ['#C4B5FD', '#A5F3FC']}
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
                accessibilityLabel={pickedImage ? t('scan.replacePhotoA11y') : t('scan.addPhotoA11y')}
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
                            <Text style={styles.scanningStatusText}>{t('scan.analyzing')}</Text>
                          </View>
                        </View>
                      ) : (
                        <LinearGradient
                          colors={['transparent', 'rgba(18,11,36,0.78)']}
                          style={styles.previewGradient}
                        >
                          <View style={styles.readyPill}>
                            <Ionicons name="checkmark-circle" size={14} color={SCAN.mint} />
                            <Text style={styles.readyPillText}>{t('scan.ready')}</Text>
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
                          colors={[SCAN.violet, SCAN.cyan]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.emptyIconRing}
                        >
                          <View style={styles.emptyIconInner}>
                            <Ionicons name="scan-outline" size={moderateScale(30)} color={SCAN.white} />
                          </View>
                        </LinearGradient>
                      </View>
                      <Text style={styles.emptyTitle}>{t('scan.tapToAdd')}</Text>
                      <Text style={styles.emptySubtitle}>{t('scan.emptyPhotoSubtitle')}</Text>
                    </View>
                  )}
                </View>
              </Pressable>

              <View style={styles.sourceRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sourceBtn,
                    pressed && styles.pressed,
                    sourcesDisabled && styles.sourceBtnDisabled,
                  ]}
                  onPress={() => void handlePick('camera')}
                  disabled={sourcesDisabled}
                >
                  <LinearGradient
                    colors={[SCAN.rose, SCAN.roseDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.camTile}
                  >
                    <View style={styles.shutterOuter}>
                      <View style={styles.shutterInner}>
                        <Ionicons name="camera" size={20} color={SCAN.rose} />
                      </View>
                    </View>
                    <Text style={styles.camTileText}>{t('scan.camera')}</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.sourceBtn,
                    pressed && styles.pressed,
                    sourcesDisabled && styles.sourceBtnDisabled,
                  ]}
                  onPress={() => void handlePick('gallery')}
                  disabled={sourcesDisabled}
                >
                  <LinearGradient
                    colors={[SCAN.violet, SCAN.violetDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.galleryTile}
                  >
                    <View style={styles.galleryIconWrap}>
                      <Ionicons name="images" size={18} color={SCAN.white} />
                    </View>
                    <Text style={styles.galleryTileText}>{t('scan.gallery')}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(400)} style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <LinearGradient colors={[SCAN.amberSoft, '#FFF7ED']} style={styles.tipsHeaderIcon}>
              <Ionicons name="bulb" size={16} color={SCAN.amber} />
            </LinearGradient>
            <Text style={styles.tipsHeaderText}>{t('scan.tipsHeader')}</Text>
          </View>
          <View style={styles.tipsRow}>
            {SCAN_TIPS.map((tip) => (
              <View key={tip.labelKey} style={[styles.tipChip, { backgroundColor: tip.bg }]}>
                <View style={styles.tipIconWrap}>
                  <Ionicons name={tip.icon} size={14} color={tip.tint} />
                </View>
                <Text style={styles.tipChipText}>{t(tip.labelKey)}</Text>
                <Text style={styles.tipChipDesc}>{t(tip.descKey)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {medicines.length > 0 && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.medicineBox}>
            <LinearGradient
              colors={[SCAN.mintSoft, SCAN.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.medicineBoxGradient}
            >
              <View style={styles.medicineHeader}>
                <View style={styles.medicineHeaderLeft}>
                  <LinearGradient colors={[SCAN.mint, SCAN.mintDeep]} style={styles.medicineHeaderIcon}>
                    <Ionicons name="medical" size={16} color={SCAN.white} />
                  </LinearGradient>
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
                  <ScannedMedicineCard
                    key={`${med.correctedName}-${index}`}
                    medicine={med}
                    index={index}
                    onSearchPress={handleSearchMedicine}
                  />
                ))}
              </View>

              <Text style={styles.medicineFooter}>{t('scan.aiVerifyFooter')}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {hasScanned && !isSaved && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.saveHintCard}>
            <Ionicons name="cloud-upload-outline" size={18} color={SCAN.violet} />
            <Text style={styles.saveHintText}>{t('scan.saveHint')}</Text>
          </Animated.View>
        )}

        {scanError && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={20} color={SCAN.error} />
            </View>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>{t('scan.scanFailed')}</Text>
              <Text style={styles.errorBody}>{scanError}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {canSave ? (
          <View style={styles.footerHint}>
            <Ionicons name="cloud-upload-outline" size={14} color={SCAN.violet} />
            <Text style={[styles.footerHintText, { color: SCAN.violet }]}>
              {t('scan.readyToSaveFooter')}
            </Text>
          </View>
        ) : canScan && !hasScanned ? (
          <View style={styles.footerHint}>
            <Ionicons name="checkmark-circle" size={14} color={SCAN.mint} />
            <Text style={styles.footerHintText}>{t('scan.photoReady')}</Text>
          </View>
        ) : isSaved ? (
          <View style={styles.footerHint}>
            <Ionicons name="checkmark-circle" size={14} color={SCAN.mint} />
            <Text style={styles.footerHintText}>{t('scan.prescriptionSaved')}</Text>
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
              accessibilityLabel={t('scan.scanAgainA11y')}
            >
              <Ionicons name="scan" size={18} color={SCAN.violet} />
              <Text style={styles.secondaryBtnText}>
                {isScanning ? t('scan.analyzingShort') : t('scan.rescan')}
              </Text>
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
              accessibilityLabel={t('scan.savePrescriptionA11y')}
            >
              <LinearGradient
                colors={
                  isSaved
                    ? [SCAN.mint, SCAN.mintDeep]
                    : canSave
                      ? [SCAN.violet, SCAN.cyan]
                      : ['#D8D0EC', '#B8AEC8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanBtnInner}
              >
                <View style={styles.scanBtnIconWrap}>
                  <Ionicons
                    name={isSaved ? 'checkmark' : 'cloud-upload-outline'}
                    size={20}
                    color={SCAN.white}
                  />
                </View>
                <Text style={styles.scanBtnText}>
                  {isSaving
                    ? t('scan.saving')
                    : isSaved
                      ? t('scan.saved')
                      : t('scan.savePrescription')}
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
            accessibilityLabel={t('scan.scanPhotoA11y')}
          >
            <LinearGradient
              colors={canScan ? [SCAN.violet, SCAN.cyan] : ['#D8D0EC', '#B8AEC8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanBtnInner}
            >
              <View style={styles.scanBtnIconWrap}>
                <Ionicons name="scan" size={20} color={SCAN.white} />
              </View>
              <Text style={styles.scanBtnText}>
                {isScanning ? t('scan.analyzingShort') : t('scan.tapToScan')}
              </Text>
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
    backgroundColor: SCAN.page,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  pageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orbViolet: {
    position: 'absolute',
    width: moderateScale(240),
    height: moderateScale(240),
    borderRadius: moderateScale(120),
    backgroundColor: '#C4B5FD',
    opacity: 0.42,
    top: -moderateScale(60),
    right: -moderateScale(70),
  },
  orbCyan: {
    position: 'absolute',
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: '#A5F3FC',
    opacity: 0.34,
    top: moderateScale(210),
    left: -moderateScale(80),
  },
  orbRose: {
    position: 'absolute',
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: '#FECDD3',
    opacity: 0.28,
    top: moderateScale(80),
    left: moderateScale(40),
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  aiBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: SCAN.violet,
    letterSpacing: 0.4,
  },
  backBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: SCAN.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.12)',
    shadowColor: SCAN.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  clearBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: SCAN.roseSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnDisabled: {
    backgroundColor: SCAN.surface,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.12)',
  },
  topTitle: {
    ...typography.body,
    fontWeight: '800',
    color: SCAN.ink,
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
  heroTitle: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: SCAN.ink,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    lineHeight: moderateScale(32),
  },
  heroTitleAccent: {
    color: SCAN.violet,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: SCAN.inkSoft,
    lineHeight: moderateScale(22),
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  featureIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: SCAN.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: SCAN.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: SCAN.ink,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    color: SCAN.muted,
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
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepCirclePending: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  stepLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: SCAN.muted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: SCAN.violet,
    fontWeight: '800',
  },
  stepLabelComplete: {
    color: SCAN.mint,
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(124,58,237,0.14)',
    marginTop: moderateScale(16),
    marginHorizontal: -spacing.xs,
    borderRadius: 2,
  },
  stepConnectorActive: {
    backgroundColor: SCAN.mint,
  },
  previewCardBorder: {
    borderRadius: borderRadius.xxl + 4,
    padding: 2,
    marginBottom: spacing.lg,
    shadowColor: SCAN.violet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  previewCard: {
    backgroundColor: SCAN.scanner,
    borderRadius: borderRadius.xxl + 2,
    padding: spacing.md,
  },
  previewFrame: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: SCAN.scannerMid,
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  readyPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: SCAN.ink,
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
    backgroundColor: 'rgba(18,11,36,0.42)',
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SCAN.cyan,
  },
  scanningStatusText: {
    ...typography.caption,
    fontWeight: '700',
    color: SCAN.ink,
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: SCAN.cyan,
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
  emptyIconRing: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  emptyIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(36),
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '700',
    color: SCAN.white,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sourceBtn: {
    flex: 1,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    minHeight: moderateScale(56),
  },
  camTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(56),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  shutterOuter: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  shutterInner: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: SCAN.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camTileText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: SCAN.white,
    letterSpacing: 0.2,
  },
  galleryTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(56),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  galleryIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryTileText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: SCAN.white,
    letterSpacing: 0.2,
  },
  sourceBtnDisabled: {
    opacity: 0.65,
  },
  tipsCard: {
    backgroundColor: SCAN.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.1)',
    marginBottom: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsHeaderIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsHeaderText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: SCAN.ink,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipChip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  tipIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: SCAN.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tipChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: SCAN.ink,
    textAlign: 'center',
    marginBottom: 2,
  },
  tipChipDesc: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    color: SCAN.muted,
    textAlign: 'center',
  },
  medicineBox: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.18)',
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
    flex: 1,
  },
  medicineHeaderIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineTitle: {
    ...typography.body,
    fontWeight: '800',
    color: SCAN.ink,
    flex: 1,
  },
  medicineBadge: {
    backgroundColor: SCAN.mint,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: moderateScale(28),
    alignItems: 'center',
  },
  medicineBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: SCAN.white,
  },
  medicineList: {
    gap: spacing.md,
  },
  medicineFooter: {
    ...typography.caption,
    color: SCAN.inkSoft,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5,150,105,0.16)',
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: SCAN.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SCAN.errorSoft,
    marginBottom: spacing.md,
  },
  errorIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: SCAN.errorSoft,
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
    color: SCAN.error,
    marginBottom: spacing.xs,
  },
  errorBody: {
    ...typography.caption,
    color: SCAN.inkSoft,
    lineHeight: moderateScale(18),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(244,240,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.12)',
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
    color: SCAN.mint,
  },
  scanBtn: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  scanBtnReady: {
    shadowColor: SCAN.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 10,
  },
  scanBtnDisabled: {
    opacity: 0.85,
  },
  scanBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(58),
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  scanBtnIconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    ...typography.button,
    color: SCAN.white,
    fontWeight: '800',
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
    minHeight: moderateScale(58),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: SCAN.violet,
    backgroundColor: SCAN.surface,
  },
  secondaryBtnText: {
    ...typography.button,
    color: SCAN.violet,
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
    borderRadius: borderRadius.xl,
    backgroundColor: SCAN.violetSoft,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.16)',
  },
  saveHintText: {
    ...typography.bodySmall,
    color: SCAN.inkSoft,
    flex: 1,
    lineHeight: moderateScale(18),
  },
});

export default MedicineScanScreen;
