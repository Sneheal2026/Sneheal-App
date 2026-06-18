import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '@/screens/home/HomeScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import CartScreen from '@/screens/cart/CartScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ScanPlaceholderScreen from '@/screens/scan/ScanPlaceholderScreen';
import AnimatedTabBar from '@/components/navigation/AnimatedTabBar';
import ScanTabButton from '@/components/navigation/ScanTabButton';
import { TabBarVisibilityProvider } from '@/context/TabBarVisibilityContext';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import type { AuthStackParamList, TabParamList } from './types';
import theme from '@/styles/theme';

const Tab = createBottomTabNavigator<TabParamList>();
const { colors, spacing, typography, shadows } = theme;

type TabIconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: keyof TabParamList;
  component: React.ComponentType<any>;
  title: string;
  iconOutline: TabIconName;
  iconFilled: TabIconName;
  isScan?: boolean;
}

const TABS: TabConfig[] = [
  { name: 'Home', component: HomeScreen, title: 'Home', iconOutline: 'home-outline', iconFilled: 'home' },
  { name: 'Search', component: SearchScreen, title: 'Search', iconOutline: 'search-outline', iconFilled: 'search' },
  { name: 'Scan', component: ScanPlaceholderScreen, title: '', iconOutline: 'scan-outline', iconFilled: 'scan', isScan: true },
  { name: 'Cart', component: CartScreen, title: 'Cart', iconOutline: 'cart-outline', iconFilled: 'cart' },
  { name: 'Orders', component: OrdersScreen, title: 'Orders', iconOutline: 'receipt-outline', iconFilled: 'receipt' },
];

const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);

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
          },
          tabBarStyle: {
            ...styles.tabBar,
            position: 'absolute',
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
              title: tab.title,
              ...(tab.isScan
                ? {
                    tabBarLabel: () => null,
                    tabBarButton: (props) => <ScanTabButton {...props} />,
                  }
                : {}),
            }}
            listeners={
              tab.isScan
                ? ({ navigation }) => ({
                    tabPress: (e) => {
                      e.preventDefault();
                      const parent =
                        navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
                      parent?.navigate('MedicineScan');
                    },
                  })
                : undefined
            }
          />
        ))}
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingTop: spacing.sm,
    ...shadows.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    paddingTop: spacing.xs,
  },
});

export default AppNavigator;
