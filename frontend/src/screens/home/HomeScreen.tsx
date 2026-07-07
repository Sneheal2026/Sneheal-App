import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  HomeHeader,
  SearchBar,
  PromoBanner,
  CategoriesGrid,
  FeaturedProducts,
} from '@/components/home';
import { FEATURED_PRODUCTS } from '@/components/home/FeaturedProducts';
import FloatingCartBar from '@/components/cart/FloatingCartBar';
import { useTabBarScrollState } from '@/hooks/useTabBarScrollHandler';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { updateTabBarOnScroll } from '@/utils/tabBarScrollWorklet';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';
import type { AuthStackParamList } from '@/navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILL_IMAGE = require('../../../assets/images/Sneheal-Pill-2.webp');

const { colors, spacing } = theme;

const STICKY_THRESHOLD = 140;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const [stickyHeaderActive, setStickyHeaderActive] = useState(false);
  const scrollY = useSharedValue(0);
  const { tabBarOffset, tabBarHeight, lastScrollY } = useTabBarScrollState();
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const handleIncrement = useCallback((id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  const handleDecrement = useCallback((id: string) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  }, []);

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
    [quantities],
  );

  const previewImages = useMemo(
    () =>
      FEATURED_PRODUCTS.filter((p) => (quantities[p.id] ?? 0) > 0).map((p) => p.image),
    [quantities],
  );

  const handleOpenSettings = useCallback(() => {
    navigation.getParent()?.navigate('Settings' as never);
  }, [navigation]);

  const handleOpenNotifications = useCallback(() => {
    navigation.getParent()?.navigate('Notifications' as never);
  }, [navigation]);

  const handleOpenCart = useCallback(() => {
    navigation.navigate('Cart' as never);
  }, [navigation]);

  const handleUploadScan = useCallback(() => {
    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    parent?.navigate('MedicineScan');
  }, [navigation]);

  const handleOpenProduct = useCallback((id: string) => {
    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    parent?.navigate('ProductDetails', { productId: id });
  }, [navigation]);

  const { status: locationStatus, location, refresh: refreshLocation } = useLiveLocation(true);
  const { addresses, selectedAddress, refresh: refreshAddresses } = useSavedAddresses();

  useFocusEffect(
    useCallback(() => {
      void refreshAddresses(false);
    }, [refreshAddresses]),
  );

  const addressLabel = useMemo(() => {
    if (selectedAddress) return selectedAddress.addressLine;
    if (locationStatus === 'loading') return 'Fetching your location...';
    if (locationStatus === 'error') return 'Tap to enable location';
    return location?.addressLine ?? 'Add delivery address';
  }, [selectedAddress, locationStatus, location?.addressLine]);

  const addressTag = useMemo(() => {
    if (selectedAddress) {
      if (selectedAddress.type === 'other') return selectedAddress.customTypeLabel || 'Other';
      return selectedAddress.type.charAt(0).toUpperCase() + selectedAddress.type.slice(1);
    }
    return location?.shortLabel;
  }, [selectedAddress, location?.shortLabel]);

  const handleLocationPress = useCallback(() => {
    if (locationStatus === 'error' && addresses.length === 0 && !selectedAddress) {
      void refreshLocation();
      return;
    }

    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();

    if (addresses.length > 0) {
      parent?.navigate('SavedAddresses');
      return;
    }

    parent?.navigate('LocationMap', { returnTo: 'Main' });
  }, [navigation, locationStatus, refreshLocation, selectedAddress, addresses.length]);

  const contentTopInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const offsetY = event.contentOffset.y;
      scrollY.value = offsetY;
      updateTabBarOnScroll(offsetY, lastScrollY, tabBarOffset, tabBarHeight);
    },
  });

  useAnimatedReaction(
    () => scrollY.value >= STICKY_THRESHOLD - 30,
    (active) => {
      runOnJS(setStickyHeaderActive)(active);
    },
  );

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

  const { toggleListening, isListening } = useVoiceRecognition({
    onTranscriptChange: handleSearchChange,
  });

  const clearScrollEndTimer = useCallback(() => {
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = null;
    }
  }, []);

  const handleScrollBegin = useCallback(() => {
    clearScrollEndTimer();
    setIsScrolling(true);
  }, [clearScrollEndTimer]);

  const handleScrollEnd = useCallback(() => {
    clearScrollEndTimer();
    scrollEndTimer.current = setTimeout(() => {
      setIsScrolling(false);
      scrollEndTimer.current = null;
    }, 80);
  }, [clearScrollEndTimer]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(colors.headerGradientStart);
      }
      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('transparent');
        }
      };
    }, []),
  );

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={[]}>
      <ExpoStatusBar style="dark" translucent />
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.stickyHeader,
            { paddingTop: contentTopInset + spacing.sm },
            stickyStyle,
          ]}
          pointerEvents={stickyHeaderActive ? 'box-none' : 'none'}
        >
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onMicPress={toggleListening}
            onDocumentPress={handleUploadScan}
            isListening={isListening}
            compact
          />
        </Animated.View>

        <Animated.ScrollView
          style={globalStyles.screenContainer}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: totalItems > 0
                ? tabBarHeight + spacing.xxxxxl + spacing.xxl + spacing.md
                : tabBarHeight,
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollBegin={clearScrollEndTimer}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          removeClippedSubviews={false}
          overScrollMode="never"
          bounces={Platform.OS === 'ios'}
        >
          <HomeHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onMicPress={toggleListening}
            isVoiceListening={isListening}
            isScrolling={isScrolling}
            onAccountPress={handleOpenSettings}
            onNotificationsPress={handleOpenNotifications}
            addressLabel={addressLabel}
            addressTag={addressTag}
            onLocationPress={handleLocationPress}
            onUploadScanPress={handleUploadScan}
          />

          <View style={styles.contentSection}>
            <CategoriesGrid />
            <PromoBanner isScrolling={isScrolling} />
            <FeaturedProducts
              quantities={quantities}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onPressItem={handleOpenProduct}
            />
          </View>

          <View style={styles.pillImageWrap} pointerEvents="none">
            <Image
              source={PILL_IMAGE}
              style={styles.pillImage}
              resizeMode="contain"
            />
          </View>
        </Animated.ScrollView>

        <FloatingCartBar
          totalItems={totalItems}
          previewImages={previewImages}
          onPress={handleOpenCart}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {},
  contentSection: {
    paddingTop: spacing.sm,
    zIndex: 10,
    elevation: 10,
  },
  pillImageWrap: {
    marginTop: -109,
    marginBottom: -109,
    overflow: 'hidden',
    zIndex: 0,
  },
  pillImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.9,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.headerGradientMid,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default HomeScreen;
