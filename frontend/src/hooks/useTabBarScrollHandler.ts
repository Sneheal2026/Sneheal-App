import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useTabBarVisibility } from '@/context/TabBarVisibilityContext';
import { updateTabBarOnScroll } from '@/utils/tabBarScrollWorklet';

export const useTabBarScrollState = () => {
  const { tabBarOffset, tabBarHeight, showTabBar } = useTabBarVisibility();
  const lastScrollY = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      lastScrollY.value = 0;
      showTabBar();

      return () => {
        lastScrollY.value = 0;
      };
    }, [lastScrollY, showTabBar]),
  );

  return { tabBarOffset, tabBarHeight, lastScrollY };
};

export const useTabBarScrollHandler = () => {
  const { tabBarOffset, tabBarHeight, lastScrollY } = useTabBarScrollState();

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      updateTabBarOnScroll(
        event.contentOffset.y,
        lastScrollY,
        tabBarOffset,
        tabBarHeight,
      );
    },
  });
};
