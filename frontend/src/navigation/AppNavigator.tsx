import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HomeScreen from '@/screens/home/HomeScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import CartScreen from '@/screens/cart/CartScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ScanPlaceholderScreen from '@/screens/scan/ScanPlaceholderScreen';
import AnimatedTabBar from '@/components/navigation/AnimatedTabBar';
import ScanTabButton from '@/components/navigation/ScanTabButton';
import { TabBarVisibilityProvider } from '@/context/TabBarVisibilityContext';
import { useTheme } from '@/hooks/useTheme';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import type { TabParamList } from './types';
import theme from '@/styles/theme';

const Tab = createBottomTabNavigator<TabParamList>();
const { spacing, typography } = theme;

type TabIconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: keyof TabParamList;
  component: React.ComponentType<any>;
  titleKey: 'home' | 'search' | 'scan' | 'cart' | 'orders';
  iconOutline: TabIconName;
  iconFilled: TabIconName;
  isScan?: boolean;
}

const TABS: TabConfig[] = [
  { name: 'Home', component: HomeScreen, titleKey: 'home', iconOutline: 'home-outline', iconFilled: 'home' },
  { name: 'Search', component: SearchScreen, titleKey: 'search', iconOutline: 'search-outline', iconFilled: 'search' },
  { name: 'Scan', component: ScanPlaceholderScreen, titleKey: 'scan', iconOutline: 'scan-outline', iconFilled: 'scan', isScan: true },
  { name: 'Cart', component: CartScreen, titleKey: 'cart', iconOutline: 'cart-outline', iconFilled: 'cart' },
  { name: 'Orders', component: OrdersScreen, titleKey: 'orders', iconOutline: 'receipt-outline', iconFilled: 'receipt' },
];

const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tabBarHeight = getTabBarHeight(insets.bottom);

  const tabTitles = useMemo(
    () => ({
      home: t('tabs.home'),
      search: t('tabs.search'),
      scan: t('tabs.scan'),
      cart: t('tabs.cart'),
      orders: t('tabs.orders'),
    }),
    [t],
  );

  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (tab?.isScan) return null;
            const iconName = focused ? tab?.iconFilled : tab?.iconOutline;
            return <Ionicons name={iconName ?? 'ellipse'} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            ...typography.caption,
            fontWeight: 'bold',
            marginTop: spacing.xxs,
            marginBottom: spacing.xxs,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            position: 'absolute',
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.sm,
            height: tabBarHeight,
            overflow: 'visible',
          },
          tabBarItemStyle: styles.tabItem,
        })}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              title: tabTitles[tab.titleKey],
              ...(tab.isScan
                ? {
                    tabBarLabel: () => null,
                    tabBarButton: (props) => <ScanTabButton {...props} />,
                    tabBarItemStyle: {
                      ...styles.tabItem,
                      overflow: 'visible',
                    },
                  }
                : {}),
            }}
          />
        ))}
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs,
  },
});

export default AppNavigator;
