import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AddressDraft, SavedAddress } from '@/types/location.types';

// ── Auth & Roles ────────────────────────────────────────────────
export type AppLanguage = 'ENGLISH' | 'HINDI' | 'MARATHI';
export type UserRole = 'customer' | 'delivery_agent' | 'doctor';

export type SearchTabParams = {
  query?: string;
  autofocus?: boolean;
  startVoice?: boolean;
};

export type TabParamList = {
  Home: undefined;
  Search: SearchTabParams | undefined;
  Scan: undefined;
  Cart: undefined;
  Orders: undefined;
};

// ── Auth Stack ──────────────────────────────────────────────────
export type AuthStackParamList = {
  PhoneNumber: undefined;
  Otp: { phoneNumber: string; devOtp?: string };
  Registration: { phoneNumber: string };
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Settings: undefined;
  Notifications: undefined;
  HelpAndSupport: undefined;
  ShareApp: undefined;
  AboutSneheal: undefined;
  PrivacyPolicy: undefined;
  DevStorageInspector: undefined;
  LanguageSettings: undefined;
  ColorSettings: undefined;
  MedicineScan: undefined;
  ProductDetails: { productId: string };
  LocationMap: { editAddress?: SavedAddress; returnTo?: 'Main' | 'SavedAddresses' } | undefined;
  AddressDetails: {
    draft: AddressDraft;
    editAddress?: SavedAddress;
    returnTo?: 'Main' | 'SavedAddresses';
  };
  SavedAddresses: undefined;
  MedicineReminders: undefined;
  FamilyMembers: undefined;
  EmergencyContacts: undefined;
  Prescriptions: undefined;
  DeliveryAgentMain: undefined;
  DeliveryNavigation: {
    orderId: string;
    publicId?: string;
    customerAddress: string;
    customerCoords?: { latitude: number; longitude: number };
    customerMobile?: string;
  };
  CustomerTracking: {
    orderId: string;
    customerCoords: { latitude: number; longitude: number };
    customerAddress: string;
  };
  DoctorMain: undefined;
  PatientDetails: { patientId: string };
  OrderPlaced: { orderId: string; publicId: string; grandTotal: number };
  OrderDetail: { orderId: string };
};

// ── App Stack ──────────────────────────────────────────────────
export type AppStackParamList = {
  Main: undefined;
};

// ── Root Stack ─────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Screen prop helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
