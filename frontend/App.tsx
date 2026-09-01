import React, { useEffect, useRef, useState } from 'react';
import { StatusBar as RNStatusBar, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetworkGate from './src/components/common/NetworkGate';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import AuthBootScreen from './src/screens/auth/AuthBootScreen';
import type { AuthStackParamList } from './src/navigation/types';
import {
  addReminderActionListener,
  initializeReminderNotifications,
  rescheduleAllReminders,
} from './src/services/reminderNotificationService';
import './src/i18n';

const navigationRef = createNavigationContainerRef<AuthStackParamList>();

const AppNavigation = () => {
  const { isBootstrapping, isAuthenticated, initialNavState } = useAuth();
  const hadSession = useRef(false);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    if (isBootstrapping) return;

    if (isAuthenticated) {
      hadSession.current = true;
      return;
    }

    if (hadSession.current && navReady && navigationRef.isReady()) {
      hadSession.current = false;
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'PhoneNumber' }],
      });
    }
  }, [isAuthenticated, isBootstrapping, navReady]);

  if (isBootstrapping) {
    return <AuthBootScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={initialNavState}
      onReady={() => setNavReady(true)}
    >
      <RootNavigator />
      <StatusBar style="dark" />
      {Platform.OS === 'android' && (
        <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    void (async () => {
      await initializeReminderNotifications();
      await rescheduleAllReminders();
    })();

    const actionSubscription = addReminderActionListener();
    return () => actionSubscription.remove();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        void rescheduleAllReminders();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NetworkGate>
              <AuthProvider>
                <CartProvider>
                  <AppNavigation />
                </CartProvider>
              </AuthProvider>
            </NetworkGate>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
