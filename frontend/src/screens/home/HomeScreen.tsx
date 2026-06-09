import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  HomeHeader,
  SearchBar,
  PromoBanner,
  CategoryCards,
  OrderVia,
  FullWidthBanner,
  CategoriesGrid,
} from '@/components/home';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const { colors, spacing } = theme;

const STICKY_THRESHOLD = 140;

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const STATUS_BAR_HEIGHT = Platform.OS === 'android'
    ? StatusBar.currentHeight ?? 24
    : 0;
  const topInset = Platform.OS === 'ios' ? insets.top : STATUS_BAR_HEIGHT;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const stickyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [STICKY_THRESHOLD - 30, STICKY_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [STICKY_THRESHOLD - 30, STICKY_THRESHOLD],
          [-8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={[]}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        <Animated.View
          style={[
            styles.stickyHeader,
            { paddingTop: topInset + spacing.sm },
            stickyStyle,
          ]}
        >
          <SearchBar value={searchQuery} onChangeText={handleSearchChange} compact />
        </Animated.View>

        <Animated.ScrollView
          style={globalStyles.screenContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          removeClippedSubviews
          bounces={Platform.OS === 'ios'}
        >
          <HomeHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />

          <View style={styles.contentSection}>
            <PromoBanner />
            <CategoryCards />
            <OrderVia />
            <FullWidthBanner />
            <CategoriesGrid />
          </View>

          <Image
            source={require('../../../assets/images/Sneheal-Pill-1.png')}
            style={styles.pillImage}
            resizeMode="contain"
          />
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 0,
  },
  contentSection: {
    paddingTop: spacing.sm,
  },
  pillImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 2,
    marginTop: -109,
    marginBottom: -109,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default HomeScreen;
