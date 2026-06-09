import React from 'react';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
        {Platform.OS === 'android' && (
          <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
