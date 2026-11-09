import type { FamilyMember, FamilyMemberFormData } from '@/types/family.types';
import { authenticatedApiRequest } from './authTokenManager';

export const fetchFamilyMembersFromApi = (): Promise<FamilyMember[]> =>
  authenticatedApiRequest<FamilyMember[]>('/api/family-members');

export const createFamilyMemberOnApi = (
  payload: FamilyMemberFormData,
): Promise<FamilyMember> =>
  authenticatedApiRequest<FamilyMember>('/api/family-members', {
    method: 'POST',
    body: payload,
  });

export const updateFamilyMemberOnApi = (
  id: string,
  payload: FamilyMemberFormData,
): Promise<FamilyMember> =>
  authenticatedApiRequest<FamilyMember>(`/api/family-members/${id}`, {
    method: 'PUT',
    body: payload,
  });
