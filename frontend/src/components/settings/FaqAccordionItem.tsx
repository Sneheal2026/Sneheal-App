import React, { useMemo, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const TIMING_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
};

interface FaqAccordionItemProps {
  question: string;
  answer: string;
  defaultExpanded?: boolean;
}

const FaqAccordionItem: React.FC<FaqAccordionItemProps> = ({
  question,
  answer,
  defaultExpanded = false,
}) => {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const progress = useSharedValue(defaultExpanded ? 1 : 0);
  const contentHeight = useSharedValue(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          ...shadows.sm,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.lg,
        },
        pressed: {
          opacity: 0.7,
        },
        question: {
          ...typography.bodySmall,
          flex: 1,
          fontWeight: '600',
          color: colors.textPrimary,
          lineHeight: 20,
        },
        body: {
          overflow: 'hidden',
        },
        answerMeasure: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
        },
        answerWrap: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          paddingTop: spacing.md,
        },
        answer: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          lineHeight: 22,
        },
      }),
    [borderRadius, colors, shadows, spacing, typography],
  );

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, TIMING_CONFIG);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
  }));

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={question}
      >
        <Text style={styles.question}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.body, bodyStyle]}>
        <View
          style={styles.answerMeasure}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            if (height > 0 && contentHeight.value !== height) {
              contentHeight.value = height;
            }
          }}
        >
          <View style={styles.answerWrap}>
            <Text style={styles.answer}>{answer}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default React.memo(FaqAccordionItem);
