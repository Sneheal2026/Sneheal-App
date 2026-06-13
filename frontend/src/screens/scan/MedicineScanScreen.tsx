import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
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

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const PAGE_BG = '#F5F6F8';
const ACCENT = colors.primary;
const ACCENT_DARK = colors.primaryDark;
const PERMISSION_MESSAGE =
  'Allow camera or photo access to upload prescriptions and medicine images.';

const SCAN_TIPS = [
  { icon: 'sunny-outline' as const, label: 'Good light' },
  { icon: 'scan-outline' as const, label: 'Full frame' },
  { icon: 'eye-outline' as const, label: 'Clear text' },
];

const SCAN_DURATION_MS = 2600;
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
  const [scanComplete, setScanComplete] = useState(false);

  const bracketPulse = useSharedValue(0.72);

  useEffect(() => {
    bracketPulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bracketPulse]);

  const bracketGlowStyle = useAnimatedStyle(() => ({
    opacity: bracketPulse.value,
  }));

  const canScan = Boolean(pickedImage) && !isScanning && !isPicking;

  const handlePick = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (isPicking || isScanning) return;

      setIsPicking(true);
      setScanComplete(false);

      try {
        const image = await pickImageFromSource(source, PERMISSION_MESSAGE);
        if (image) {
          setPickedImage(image);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } finally {
        setIsPicking(false);
      }
    },
    [isPicking, isScanning],
  );

  const handleClearImage = useCallback(() => {
    setPickedImage(null);
    setScanComplete(false);
  }, []);

  const handleScan = useCallback(async () => {
    if (!pickedImage || isScanning) return;

    setIsScanning(true);
    setScanComplete(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await new Promise((resolve) => setTimeout(resolve, SCAN_DURATION_MS));

    setIsScanning(false);
    setScanComplete(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isScanning, pickedImage]);

  const handleReplace = useCallback(() => {
    Alert.alert('Replace photo?', 'Choose a new prescription or medicine image.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => void handlePick('camera') },
      { text: 'Gallery', onPress: () => void handlePick('gallery') },
    ]);
  }, [handlePick]);

  return (
    <View style={styles.root}>
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
          <Text style={styles.topTitle}>Scan & Upload</Text>
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
          { paddingBottom: insets.bottom + moderateScale(108) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroBlock}>
          {/* <View style={styles.heroIconRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text-outline" size={18} color={ACCENT} />
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="medkit-outline" size={18} color={colors.secondary} />
            </View>
          </View> */}
          <Text style={styles.heroTitle}>Prescription or medicine photo</Text>
          <Text style={styles.heroSubtitle}>
            Upload any clear image — we will scan and identify it for you.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100).duration(350)} style={styles.previewCard}>
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
                    <Ionicons name="scan-outline" size={moderateScale(36)} color={ACCENT} />
                  </View>
                </View>
              )}
            </View>
          </Pressable>

          <View style={styles.sourceRow}>
            <Pressable
              style={({ pressed }) => [
                styles.sourceBtn,
                styles.sourceBtnPrimary,
                pressed && styles.pressed,
                (isPicking || isScanning) && styles.sourceBtnDisabled,
              ]}
              onPress={() => void handlePick('camera')}
              disabled={isPicking || isScanning}
            >
              <Ionicons name="camera" size={18} color={colors.white} />
              <Text style={styles.sourceBtnPrimaryText}>Camera</Text>
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
              <Ionicons name="images-outline" size={18} color={ACCENT} />
              <Text style={styles.sourceBtnSecondaryText}>Gallery</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(400)} style={styles.tipsRow}>
          {SCAN_TIPS.map((tip) => (
            <View key={tip.label} style={styles.tipChip}>
              <Ionicons name={tip.icon} size={14} color={ACCENT} />
              <Text style={styles.tipChipText}>{tip.label}</Text>
            </View>
          ))}
        </Animated.View>

        {scanComplete && (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Ionicons name="sparkles" size={18} color={colors.success} />
            </View>
            <View style={styles.resultCopy}>
              <Text style={styles.resultTitle}>Scan complete</Text>
              <Text style={styles.resultBody}>
                Image processed successfully. Results will show here once analysis is connected.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          onPress={() => void handleScan()}
          disabled={!canScan}
          style={({ pressed }) => [
            styles.scanBtn,
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
            <Ionicons name="scan" size={20} color={colors.white} />
            <Text style={styles.scanBtnText}>{isScanning ? 'Scanning...' : 'Tap to Scan'}</Text>
          </LinearGradient>
        </Pressable>
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
  safeTop: {
    backgroundColor: colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    marginBottom: spacing.lg,
  },
  heroIconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(11),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  heroTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: moderateScale(21),
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    marginBottom: spacing.lg,
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
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(20),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: moderateScale(46),
    borderRadius: borderRadius.lg,
  },
  sourceBtnPrimary: {
    backgroundColor: ACCENT,
  },
  sourceBtnSecondary: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
  tipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  tipChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
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
    backgroundColor: 'rgba(245,246,248,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  scanBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  scanBtnDisabled: {
    opacity: 0.8,
  },
  scanBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(54),
    paddingHorizontal: spacing.xl,
  },
  scanBtnText: {
    ...typography.button,
    color: colors.white,
  },
});

export default MedicineScanScreen;
