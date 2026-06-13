import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarHeight } from '@/navigation/tabBarConfig';

interface TabBarVisibilityContextValue {
  tabBarOffset: SharedValue<number>;
  tabBarHeight: number;
  showTabBar: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export const TabBarVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const tabBarOffset = useSharedValue(0);

  const showTabBar = useCallback(() => {
    tabBarOffset.value = withTiming(0, { duration: 220 });
  }, [tabBarOffset]);

  const value = useMemo(
    () => ({ tabBarOffset, tabBarHeight, showTabBar }),
    [tabBarOffset, tabBarHeight, showTabBar],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  }
  return context;
};
