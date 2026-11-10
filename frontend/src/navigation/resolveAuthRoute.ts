import type { AuthStackParamList } from '@/navigation/types';
import type { AuthUser } from '@/types/auth';
import { toLocalPhone } from '@/utils/phone';

export type AuthRouteName = keyof AuthStackParamList;

export type ResolvedAuthRoute = {
  route: AuthRouteName;
  params?: AuthStackParamList[AuthRouteName];
};

export const resolveAuthRoute = (user: AuthUser | null): ResolvedAuthRoute => {
  if (!user) {
    return { route: 'PhoneNumber' };
  }

  if (!user.profileCompleted) {
    const phoneNumber = toLocalPhone(user.phone);
    return { route: 'Registration', params: { phoneNumber } };
  }

  if (user.role === 'delivery_agent') {
    if (user.verificationStatus !== 'approved') {
      return { route: 'VerificationPending' };
    }
    return { route: 'DeliveryAgentMain' };
  }

  if (user.role === 'doctor') {
    if (user.verificationStatus !== 'approved') {
      return { route: 'VerificationPending' };
    }
    return { route: 'DoctorMain' };
  }

  return { route: 'Main' };
};
