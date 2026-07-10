import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  COLOR_THEME_OPTIONS,
  getColorThemeSwatch,
  type ColorThemeId,
} from '@/constants/colorThemes';
import { useTheme } from '@/hooks/useTheme';
import { hexToHue, hueToBrandHex } from '@/utils/colorUtils';

const HUE_RAINBOW = [
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#FF00FF',
  '#FF0000',
] as const;

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 16;
const CUSTOM_PERSIST_DELAY_MS = 1000;

const PRESET_OPTIONS = COLOR_THEME_OPTIONS.filter((option) => option.id !== 'custom');
const CUSTOM_OPTION = COLOR_THEME_OPTIONS.find((option) => option.id === 'custom')!;

type HuePickerProps = {
  hue: number;
  color: string;
  onChange: (hue: number) => void;
  onDragEnd: () => void;
};

const HuePicker = ({ hue, color, onChange, onDragEnd }: HuePickerProps) => {
  const widthSv = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const draggingRef = useRef(false);
  const [thumbColor, setThumbColor] = useState(color);

  const emitHue = useCallback(
    (x: number, width: number) => {
      if (width <= 0) return;
      const clamped = Math.max(0, Math.min(width, x));
      const nextHue = Math.round((clamped / width) * 360);
      onChange(nextHue);
      setThumbColor(hueToBrandHex(nextHue));
    },
    [onChange],
  );

  const markDragging = useCallback((value: boolean) => {
    draggingRef.current = value;
  }, []);

  useEffect(() => {
    if (!draggingRef.current && widthSv.value > 0) {
      thumbX.value = (hue / 360) * widthSv.value;
    }
    if (!draggingRef.current) {
      setThumbColor(color);
    }
  }, [color, hue, thumbX, widthSv]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      widthSv.value = width;
      if (!draggingRef.current) {
        thumbX.value = (hue / 360) * width;
      }
    },
    [hue, thumbX, widthSv],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .failOffsetY([-18, 18])
        .onBegin((event) => {
          'worklet';
          if (widthSv.value <= 0) return;
          isDragging.value = true;
          runOnJS(markDragging)(true);
          const x = Math.max(0, Math.min(widthSv.value, event.x));
          thumbX.value = x;
          runOnJS(emitHue)(x, widthSv.value);
        })
        .onUpdate((event) => {
          'worklet';
          if (widthSv.value <= 0) return;
          const x = Math.max(0, Math.min(widthSv.value, event.x));
          thumbX.value = x;
          runOnJS(emitHue)(x, widthSv.value);
        })
        .onFinalize(() => {
          'worklet';
          isDragging.value = false;
          runOnJS(markDragging)(false);
          runOnJS(onDragEnd)();
        }),
    [emitHue, isDragging, markDragging, onDragEnd, thumbX, widthSv],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        onLayout={handleLayout}
        style={huePickerStyles.hitArea}
        accessibilityRole="adjustable"
        accessibilityLabel="Custom color hue"
        accessibilityValue={{ now: hue, min: 0, max: 360 }}
      >
        <LinearGradient
          colors={[...HUE_RAINBOW]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={huePickerStyles.track}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            huePickerStyles.thumb,
            thumbStyle,
            { backgroundColor: thumbColor },
          ]}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const huePickerStyles = StyleSheet.create({
  hitArea: {
    height: THUMB_SIZE + 12,
    justifyContent: 'center',
    overflow: 'visible',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  thumb: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    elevation: 4,
  },
});

const ColorSettingsScreen = () => {
  const navigation = useNavigation();
  const {
    colors,
    spacing,
    typography,
    borderRadius,
    shadows,
    moderateScale,
    gradients,
    colorThemeId,
    customPrimary,
    setColorTheme,
  } = useTheme();
  const [selected, setSelected] = useState<ColorThemeId | null>(null);
  const [hue, setHue] = useState(hexToHue(customPrimary));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hueRef = useRef(hue);
  const colorThemeIdRef = useRef(colorThemeId);
  const customPrimaryRef = useRef(customPrimary);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const customPreview = useMemo(() => hueToBrandHex(hue), [hue]);

  useEffect(() => {
    hueRef.current = hue;
  }, [hue]);

  useEffect(() => {
    colorThemeIdRef.current = colorThemeId;
    customPrimaryRef.current = customPrimary;
  }, [colorThemeId, customPrimary]);

  const clearPersistTimer = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
  }, []);

  const clearThemePreviewTimer = useCallback(() => {
    if (themePreviewTimerRef.current) {
      clearTimeout(themePreviewTimerRef.current);
      themePreviewTimerRef.current = null;
    }
  }, []);

  const persistCustomColor = useCallback(
    async (nextHue: number = hueRef.current) => {
      await setColorTheme('custom', hueToBrandHex(nextHue), { persist: true });
    },
    [setColorTheme],
  );

  const scheduleCustomPersist = useCallback(() => {
    clearPersistTimer();
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void persistCustomColor();
    }, CUSTOM_PERSIST_DELAY_MS);
  }, [clearPersistTimer, persistCustomColor]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        heroGradient: {
          paddingBottom: spacing.xl,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          marginBottom: spacing.lg,
        },
        backBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        headerTitle: {
          ...typography.h4,
          fontSize: moderateScale(18),
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerSpacer: {
          width: moderateScale(40),
        },
        pressed: {
          opacity: 0.75,
        },
        heroCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginHorizontal: spacing.xl,
          padding: spacing.lg,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.primaryBorder,
          ...shadows.sm,
        },
        heroIconWrap: {
          width: moderateScale(52),
          height: moderateScale(52),
          borderRadius: moderateScale(16),
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroTextBlock: {
          flex: 1,
          gap: spacing.xxs,
        },
        heroTitle: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
          fontSize: moderateScale(15),
        },
        heroSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: moderateScale(18),
        },
        scroll: {
          flex: 1,
          marginTop: -spacing.md,
        },
        scrollContent: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        },
        loadingWrap: {
          paddingVertical: spacing.xxl,
          alignItems: 'center',
        },
        optionsList: {
          gap: spacing.md,
        },
        optionCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          ...shadows.sm,
        },
        optionCardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
          ...shadows.md,
        },
        optionCardColumn: {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: spacing.md,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        swatch: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(14),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.white,
          ...shadows.sm,
        },
        optionTextBlock: {
          flex: 1,
          minWidth: 0,
          gap: 2,
        },
        optionLabel: {
          fontSize: moderateScale(17),
          fontWeight: '800',
          color: colors.textPrimary,
          letterSpacing: -0.2,
        },
        optionLabelSelected: {
          color: colors.primary,
        },
        optionDescription: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: 2,
        },
        colorCode: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          marginTop: 2,
        },
        radioOuter: {
          width: moderateScale(24),
          height: moderateScale(24),
          borderRadius: moderateScale(12),
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioOuterSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        pickerBlock: {
          gap: spacing.sm,
          paddingTop: spacing.md,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderLight,
        },
        pickerLabelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        pickerLabel: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        pickerHex: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        footerNote: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginTop: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        footerText: {
          flex: 1,
          ...typography.caption,
          color: colors.textMuted,
          lineHeight: moderateScale(18),
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  useFocusEffect(
    useCallback(() => {
      setSelected(colorThemeIdRef.current);
      setHue(hexToHue(customPrimaryRef.current));
      setLoading(false);

      return () => {
        clearThemePreviewTimer();
        if (persistTimerRef.current) {
          clearTimeout(persistTimerRef.current);
          persistTimerRef.current = null;
          void setColorTheme('custom', hueToBrandHex(hueRef.current), { persist: true });
        }
      };
    }, [clearThemePreviewTimer, setColorTheme]),
  );

  const handleSelect = async (themeId: ColorThemeId) => {
    if (saving || selected === themeId) return;

    clearPersistTimer();
    clearThemePreviewTimer();
    setSaving(true);
    setSelected(themeId);

    try {
      if (themeId === 'custom') {
        await setColorTheme('custom', hueToBrandHex(hue), { persist: true });
      } else {
        await setColorTheme(themeId, undefined, { persist: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleHueChange = (nextHue: number) => {
    const rounded = Math.round(nextHue);
    hueRef.current = rounded;
    setHue(rounded);
    setSelected('custom');

    // Preview theme in memory only; throttle to keep the drag smooth.
    clearThemePreviewTimer();
    themePreviewTimerRef.current = setTimeout(() => {
      themePreviewTimerRef.current = null;
      void setColorTheme('custom', hueToBrandHex(hueRef.current), { persist: false });
    }, 40);
  };

  const handleHueDragEnd = () => {
    clearThemePreviewTimer();
    // Apply final preview immediately, then save after 1s of rest.
    void setColorTheme('custom', hueToBrandHex(hueRef.current), { persist: false });
    scheduleCustomPersist();
  };

  const isCustomSelected = selected === 'custom';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.55, 1]}
        style={styles.heroGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Color theme</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="color-palette" size={26} color={colors.primary} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Personalize Sneheal</Text>
              <Text style={styles.heroSubtitle}>
                Pick an accent color. It updates buttons, headers, and highlights across the app.
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.optionsList}>
            {PRESET_OPTIONS.map((option, index) => {
              const isSelected = selected === option.id;

              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInDown.delay(100 + index * 60).duration(400)}
                >
                  <Pressable
                    onPress={() => void handleSelect(option.id)}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${option.label}, ${option.primary}`}
                  >
                    <View style={[styles.swatch, { backgroundColor: getColorThemeSwatch(option) }]}>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color={colors.white} />
                      ) : null}
                    </View>

                    <View style={styles.optionTextBlock}>
                      <Text
                        style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                      <Text style={styles.colorCode}>{option.primary}</Text>
                    </View>

                    <View
                      style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color={colors.white} />
                      ) : null}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            <Animated.View
              entering={FadeInDown.delay(100 + PRESET_OPTIONS.length * 60).duration(400)}
              style={[
                styles.optionCard,
                styles.optionCardColumn,
                isCustomSelected && styles.optionCardSelected,
              ]}
            >
              <Pressable
                onPress={() => void handleSelect('custom')}
                disabled={saving}
                style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isCustomSelected }}
                accessibilityLabel={`Custom, ${customPreview}`}
              >
                <View style={[styles.swatch, { backgroundColor: customPreview }]}>
                  {isCustomSelected ? (
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                  ) : null}
                </View>

                <View style={styles.optionTextBlock}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isCustomSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {CUSTOM_OPTION.label}
                  </Text>
                  <Text style={styles.optionDescription}>{CUSTOM_OPTION.description}</Text>
                  <Text style={styles.colorCode}>{customPreview}</Text>
                </View>

                <View
                  style={[styles.radioOuter, isCustomSelected && styles.radioOuterSelected]}
                >
                  {isCustomSelected ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : null}
                </View>
              </Pressable>

              <View style={styles.pickerBlock}>
                <View style={styles.pickerLabelRow}>
                  <Text style={styles.pickerLabel}>Slide to pick a color</Text>
                  <Text style={styles.pickerHex}>{customPreview}</Text>
                </View>
                <HuePicker
                  hue={hue}
                  color={customPreview}
                  onChange={handleHueChange}
                  onDragEnd={handleHueDragEnd}
                />
              </View>
            </Animated.View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.footerText}>
            Your color choice is saved on this device and applied automatically next time you open
            Sneheal.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ColorSettingsScreen;
