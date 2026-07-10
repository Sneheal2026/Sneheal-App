import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FamilyMember } from '@/types/family.types';

const FAMILY_MEMBERS_KEY = '@sneheal/familyMembers';

const parseMembers = (raw: string | null): FamilyMember[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const raw = await AsyncStorage.getItem(FAMILY_MEMBERS_KEY);
  return parseMembers(raw);
};

export const saveFamilyMembers = async (members: FamilyMember[]): Promise<void> => {
  await AsyncStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

export const upsertFamilyMember = async (
  member: FamilyMember,
): Promise<FamilyMember> => {
  const existing = await getFamilyMembers();
  const index = existing.findIndex((item) => item.id === member.id);

  if (index >= 0) {
    existing[index] = member;
  } else {
    existing.push(member);
  }

  await saveFamilyMembers(existing);
  return member;
};

export const deleteFamilyMember = async (
  id: string,
): Promise<FamilyMember | null> => {
  const existing = await getFamilyMembers();
  const removed = existing.find((item) => item.id === id) ?? null;
  await saveFamilyMembers(existing.filter((item) => item.id !== id));
  return removed;
};
