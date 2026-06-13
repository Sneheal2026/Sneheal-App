import { apiRequest } from './apiClient';
import type { SendOtpResponse, VerifyOtpResponse } from '@/types/auth';
import { devLog } from '@/utils/devLogger';

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  devLog('Auth', 'sendOtp called', { phone });
  return apiRequest<SendOtpResponse>('/api/auth/send-otp', {
    method: 'POST',
    body: { phone },
  });
};

export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  devLog('Auth', 'verifyOtp called', { phone, otp });
  return apiRequest<VerifyOtpResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp },
  });
};
