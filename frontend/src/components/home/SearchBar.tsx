import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const SEARCH_SUGGESTIONS = [
  'Medicines',
  'Fitness Products',
  'Skin Care',
  'Vitamins',
  'Pain Relief',
  'Prescriptions',
  'Ayurveda',
  'Nutrition Drinks',
] as const;

const ROTATE_INTERVAL_MS = 2800;

interface AnimatedPlaceholderProps {
  terms: readonly string[];
  paused: boolean;
}

const AnimatedPlaceholder: React.FC<AnimatedPlaceholderProps> = ({ terms, paused }) => {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const advanceIndex = useCallback(() => {
    setIndex((prev) => (prev + 1) % terms.length);
  }, [terms.length]);

  useEffect(() => {
    if (paused || terms.length <= 1) {
      return;
    }

    const advance = () => {
      opacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      translateY.value = withTiming(-12, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      }, (finished) => {
        'worklet';
        if (!finished) return;

        runOnJS(advanceIndex)();
        translateY.value = 14;
        opacity.value = 0;

        translateY.value = withTiming(0, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
      });
    };

    const timer = setInterval(advance, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, terms.length, opacity, translateY, advanceIndex]);

  const termStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.placeholderRow} pointerEvents="none">
      <Text style={styles.placeholderPrefix}>Search &quot;</Text>
      <View style={styles.termClip}>
        <Animated.View style={termStyle}>
          <Text style={styles.placeholderTerm} numberOfLines={1}>
            {terms[index]}
          </Text>
        </Animated.View>
      </View>
      <Text style={styles.placeholderPrefix}>&quot;</Text>
    </View>
  );
};

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onMicPress?: () => void;
  onDocumentPress?: () => void;
  isListening?: boolean;
  compact?: boolean;
  insideHeader?: boolean;
  elevated?: boolean;
  animatePlaceholder?: boolean;
  searchSuggestions?: readonly string[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onMicPress,
  onDocumentPress,
  isListening = false,
  compact = false,
  insideHeader = false,
  elevated = false,
  animatePlaceholder = true,
  searchSuggestions = SEARCH_SUGGESTIONS,
  placeholder = 'Search "medicines"',
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const showAnimatedPlaceholder = animatePlaceholder && !value && !isListening && !isFocused;
  const showListeningPlaceholder = isListening && !value;
  const showStaticPlaceholder = !animatePlaceholder && !value && !isListening && !isFocused;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!value) {
      requestAnimationFrame(() => {
        inputRef.current?.setSelection(0, 0);
      });
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const searchField = (
    <View
      style={[
        styles.searchContainer,
        compact && styles.searchContainerCompact,
        insideHeader && styles.searchContainerInsideHeader,
        elevated && styles.searchContainerElevated,
        onDocumentPress != null && styles.searchContainerWithAction,
      ]}
    >
      <Ionicons
        name="search"
        size={19}
        color={colors.headerTextDark}
        style={styles.searchIcon}
      />
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={showStaticPlaceholder ? placeholder : ''}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPressIn={() => {
            if (!value) {
              requestAnimationFrame(() => {
                inputRef.current?.setSelection(0, 0);
              });
            }
          }}
          returnKeyType="search"
          selection={!value && isFocused ? { start: 0, end: 0 } : undefined}
        />
        {showAnimatedPlaceholder && (
          <AnimatedPlaceholder terms={searchSuggestions} paused={isFocused} />
        )}
        {showListeningPlaceholder && (
          <View style={styles.placeholderRow} pointerEvents="none">
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}
      </View>
      <View style={styles.micDivider} />
      <TouchableOpacity
        style={[styles.micBtn, isListening && styles.micBtnActive]}
        activeOpacity={0.7}
        onPress={() => {
          void onMicPress?.();
        }}
        accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
        accessibilityRole="button"
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={19}
          color={isListening ? colors.primary : colors.headerTextDark}
        />
      </TouchableOpacity>
    </View>
  );

  if (onDocumentPress == null) {
    return searchField;
  }

  return (
    <View style={[styles.searchRow, compact && styles.searchRowCompact]}>
      <View style={styles.searchFlex}>{searchField}</View>
      <TouchableOpacity
        style={[
          styles.documentBtn,
          compact && styles.documentBtnCompact,
          elevated && styles.documentBtnElevated,
        ]}
        activeOpacity={0.8}
        onPress={onDocumentPress}
        accessibilityLabel="Scan prescription or medicine"
        accessibilityRole="button"
      >
        <Ionicons
          name="document-text-outline"
          size={compact ? 20 : 22}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  searchRowCompact: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  searchFlex: {
    flex: 1,
    minWidth: 0,
  },
  documentBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  documentBtnCompact: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.lg,
  },
  documentBtnElevated: {
    borderWidth: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    height: 50,
    marginHorizontal: spacing.xl,
    marginTop: -spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchContainerCompact: {
    marginTop: 0,
    marginHorizontal: 0,
    height: 46,
    borderRadius: borderRadius.lg,
    marginBottom: 0,
  },
  searchContainerWithAction: {
    marginHorizontal: 0,
  },
  searchContainerInsideHeader: {
    marginTop: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchContainerElevated: {
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    ...shadows.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    position: 'relative',
  },
  searchInput: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    paddingVertical: 0,
    fontWeight: '500',
    width: '100%',
  },
  placeholderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderPrefix: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '500',
  },
  termClip: {
    overflow: 'hidden',
    justifyContent: 'center',
    maxWidth: '72%',
  },
  placeholderTerm: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  listeningText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  micDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  micBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  micBtnActive: {
    backgroundColor: colors.primary + '18',
  },
});

export default React.memo(SearchBar);
