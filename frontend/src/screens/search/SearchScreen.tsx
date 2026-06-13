import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from '@/components/home/SearchBar';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScrollHandler';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography, borderRadius } = theme;

const POPULAR_SEARCHES = [
  'Paracetamol',
  'Vitamin C',
  'Pain Relief',
  'Multivitamins',
  'Cough Syrup',
  'Face Wash',
];

const CATEGORIES = [
  'Vitamins & Minerals',
  'Pain Relief',
  'Skin Care',
  'Hair Care',
  'Oral Care',
  'Ayurveda',
  'Fever & Cold',
  'Nutritional Drinks',
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const tabBarScrollHandler = useTabBarScrollHandler();

  const { toggleListening, isListening } = useVoiceRecognition({
    onTranscriptChange: setSearchQuery,
  });

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onMicPress={toggleListening}
          isListening={isListening}
          compact
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={tabBarScrollHandler}
        scrollEventThrottle={16}
      >
        <Text style={styles.sectionTitle}>Popular Searches</Text>
        <View style={styles.chipsRow}>
          {POPULAR_SEARCHES.map((item) => (
            <Pressable
              key={item}
              style={styles.chip}
              onPress={() => setSearchQuery(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((name) => (
            <Pressable key={name} style={styles.categoryItem}>
              <Text style={styles.categoryText}>{name}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
});

export default SearchScreen;
