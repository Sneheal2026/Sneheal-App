import React from 'react';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import AuthBootScreen from './src/screens/auth/AuthBootScreen';

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigation />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
