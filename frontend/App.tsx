import React, { useEffect, useRef } from 'react';
import { StatusBar as RNStatusBar, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetworkGate from './src/components/common/NetworkGate';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import AuthBootScreen from './src/screens/auth/AuthBootScreen';
import {
  initializeReminderNotifications,
  rescheduleAllReminders,
} from './src/services/reminderNotificationService';

const AppNavigation = () => {
  const { isBootstrapping, initialNavState } = useAuth();

  if (isBootstrapping) {
    return <AuthBootScreen />;
  }

  return (
    <NavigationContainer initialState={initialNavState}>
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
          <NetworkGate>
            <AuthProvider>
              <AppNavigation />
            </AuthProvider>
          </NetworkGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
