import type { UserRole } from '@/navigation/types';

export type AuthUser = {
  id: number;
  phone: string;
  username: string | null;
  language: string | null;
  role: UserRole | null;
  profileCompleted: boolean;
  createdAt?: string;
};

export type SendOtpResponse = {
  resendAfterSeconds: number;
  devOtp?: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshSessionResponse = VerifyOtpResponse;

export type CompleteRegistrationResponse = VerifyOtpResponse;

export type ImageDocument = {
  mimeType: string;
  base64: string;
};

export type DoctorClinic = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

export type DeliveryDocuments = {
  aadhar: ImageDocument;
  license: ImageDocument;
};

export type CompleteRegistrationPayload = {
  username: string;
  language: 'ENGLISH' | 'HINDI' | 'MARATHI';
  role: 'customer' | 'doctor' | 'delivery_agent';
  clinic?: DoctorClinic;
  documents?: DeliveryDocuments;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
};
