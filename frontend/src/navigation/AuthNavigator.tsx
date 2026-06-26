import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneNumberScreen from '@/screens/auth/PhoneNumberScreen';
import OtpScreen from '@/screens/auth/OtpScreen';
import RegistrationScreen from '@/screens/auth/RegistrationScreen';
import DeliveryAgentHomeScreen from '@/screens/delivery/DeliveryAgentHomeScreen';
import DoctorHomeScreen from '@/screens/doctor/DoctorHomeScreen';
import AppNavigator from './AppNavigator';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import SavedAddressesScreen from '@/screens/settings/SavedAddressesScreen';
import HelpAndSupportScreen from '@/screens/settings/HelpAndSupportScreen';
import MedicineScanScreen from '@/screens/scan/MedicineScanScreen';
import type { AuthStackParamList } from './types';
import theme from '@/styles/theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const { colors } = theme;

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Main" component={AppNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
      <Stack.Screen
        name="SelectLocation"
        getComponent={() => require('@/screens/location/SelectLocationScreen').default}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="MedicineScan" component={MedicineScanScreen} />
      <Stack.Screen name="DeliveryAgentMain" component={DeliveryAgentHomeScreen} />
      <Stack.Screen name="DoctorMain" component={DoctorHomeScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
