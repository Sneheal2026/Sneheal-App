import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FaqAccordionItem from '@/components/settings/FaqAccordionItem';
import {
  FAQ_CATEGORIES,
  HELP_FAQ,
  SUPPORT_CONTACT,
  type FaqCategory,
} from '@/constants/helpFaq';
import { useTheme } from '@/hooks/useTheme';

const HelpAndSupportScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'all'>('all');

  const filteredFaq = useMemo(() => {
    if (activeCategory === 'all') return HELP_FAQ;
    return HELP_FAQ.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        safeTop: {
          backgroundColor: colors.white,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.white,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSecondary,
        },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          ...typography.h3,
          fontSize: moderateScale(17),
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerSpacer: {
          width: 36,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          padding: spacing.xl,
          paddingBottom: spacing.xxxxxl,
          gap: spacing.lg,
        },
        introCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: `${colors.primary}18`,
          ...shadows.sm,
        },
        introIconWrap: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        introTextBlock: {
          flex: 1,
          gap: spacing.xxs,
        },
        introTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        introText: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        chipsRow: {
          gap: spacing.sm,
          paddingRight: spacing.xl,
        },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chipTextActive: {
          color: colors.white,
        },
        faqList: {
          gap: spacing.sm,
        },
        contactCard: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...shadows.sm,
        },
        contactTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xxs,
        },
        contactSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 18,
          marginBottom: spacing.md,
        },
        contactRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        contactIconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        contactTextBlock: {
          flex: 1,
          gap: 2,
        },
        contactLabel: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        contactValue: {
          ...typography.bodySmall,
          fontWeight: '500',
          color: colors.textPrimary,
        },
        contactDivider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginVertical: spacing.xs,
        },
        pressed: {
          opacity: 0.7,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`);
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, '')}`);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.introCard}>
          <View style={styles.introIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
          </View>
          <View style={styles.introTextBlock}>
            <Text style={styles.introTitle}>How can we help?</Text>
            <Text style={styles.introText}>
              Browse answers to common questions about orders, prescriptions, and delivery.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <Pressable
              onPress={() => setActiveCategory('all')}
              style={({ pressed }) => [
                styles.chip,
                activeCategory === 'all' && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, activeCategory === 'all' && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {FAQ_CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setActiveCategory(category.id)}
                style={({ pressed }) => [
                  styles.chip,
                  activeCategory === category.id && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === category.id && styles.chipTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.faqList}
        >
          {filteredFaq.map((item) => (
            <FaqAccordionItem
              key={item.id}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>
            Our support team is here to assist you with any questions.
          </Text>

          <Pressable
            onPress={handleEmail}
            style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Email support at ${SUPPORT_CONTACT.email}`}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.contactTextBlock}>
              <Text style={styles.contactLabel}>Email us</Text>
              <Text style={styles.contactValue}>{SUPPORT_CONTACT.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <View style={styles.contactDivider} />

          <Pressable
            onPress={handlePhone}
            style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Call support at ${SUPPORT_CONTACT.phone}`}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.contactTextBlock}>
              <Text style={styles.contactLabel}>Call us</Text>
              <Text style={styles.contactValue}>{SUPPORT_CONTACT.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default HelpAndSupportScreen;
