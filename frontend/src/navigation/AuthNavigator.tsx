import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneNumberScreen from '@/screens/auth/PhoneNumberScreen';
import OtpScreen from '@/screens/auth/OtpScreen';
import RegistrationScreen from '@/screens/auth/RegistrationScreen';
import DeliveryAgentHomeScreen from '@/screens/delivery/DeliveryAgentHomeScreen';
import DeliveryNavigationScreen from '@/screens/delivery/DeliveryNavigationScreen';
import DoctorHomeScreen from '@/screens/doctor/DoctorHomeScreen';
import AppNavigator from './AppNavigator';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import HelpAndSupportScreen from '@/screens/settings/HelpAndSupportScreen';
import ShareAppScreen from '@/screens/settings/ShareAppScreen';
import AboutSnehealScreen from '@/screens/settings/AboutSnehealScreen';
import MedicineScanScreen from '@/screens/scan/MedicineScanScreen';
import ProductDetailsScreen from '@/screens/product/ProductDetailsScreen';
import MapScreen from '@/screens/map/MapScreen';
import AddressDetailsScreen from '@/screens/address/AddressDetailsScreen';
import SavedAddressesScreen from '@/screens/address/SavedAddressesScreen';
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
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
      <Stack.Screen name="ShareApp" component={ShareAppScreen} />
      <Stack.Screen name="AboutSneheal" component={AboutSnehealScreen} />
      <Stack.Screen name="MedicineScan" component={MedicineScanScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="LocationMap" component={MapScreen} />
      <Stack.Screen name="AddressDetails" component={AddressDetailsScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="DeliveryAgentMain" component={DeliveryAgentHomeScreen} />
      <Stack.Screen name="DeliveryNavigation" component={DeliveryNavigationScreen} />
      <Stack.Screen name="DoctorMain" component={DoctorHomeScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
