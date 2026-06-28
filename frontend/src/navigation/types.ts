import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ── Auth & Roles ────────────────────────────────────────────────
export type AppLanguage = 'ENGLISH' | 'HINDI' | 'MARATHI';
export type UserRole = 'customer' | 'delivery_agent' | 'doctor';

// ── Auth Stack ──────────────────────────────────────────────────
export type AuthStackParamList = {
  PhoneNumber: undefined;
  Otp: { phoneNumber: string; devOtp?: string };
  Registration: { phoneNumber: string };
  Main: undefined;
  Settings: undefined;
  Notifications: undefined;
  HelpAndSupport: undefined;
  MedicineScan: undefined;
  DeliveryAgentMain: undefined;
  DoctorMain: undefined;
};

// ── App Tabs ──────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Scan: undefined;
  Cart: undefined;
  Orders: undefined;
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
