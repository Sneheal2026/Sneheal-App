import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FamilyMember, FamilyMemberFormData } from '@/types/family.types';
import { ApiError } from './apiClient';
import { getValidAccessToken } from './authTokenManager';
import {
  createFamilyMemberOnApi,
  fetchFamilyMembersFromApi,
  updateFamilyMemberOnApi,
} from './familyMemberApiService';

const FAMILY_MEMBERS_KEY = '@sneheal/familyMembers';
const FAMILY_MEMBERS_LAST_SYNC_KEY = '@sneheal/familyMembersLastSyncAt';

/** Soft TTL: screen focus reloads stay cache-first; avoids unnecessary calls */
const SYNC_TTL_MS = 5 * 60 * 1000;

let syncInFlight: Promise<FamilyMember[]> | null = null;

const parseMembers = (raw: string | null): FamilyMember[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isServerId = (id: string): boolean => /^\d+$/.test(id);

export const getCachedFamilyMembers = async (): Promise<FamilyMember[]> => {
  const raw = await AsyncStorage.getItem(FAMILY_MEMBERS_KEY);
  return parseMembers(raw);
};

export const saveFamilyMembers = async (members: FamilyMember[]): Promise<void> => {
  await AsyncStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

const markSynced = async (): Promise<void> => {
  await AsyncStorage.setItem(FAMILY_MEMBERS_LAST_SYNC_KEY, String(Date.now()));
};

const isCacheFresh = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(FAMILY_MEMBERS_LAST_SYNC_KEY);
  if (!raw) return false;
  const syncedAt = Number(raw);
  if (!Number.isFinite(syncedAt)) return false;
  return Date.now() - syncedAt < SYNC_TTL_MS;
};

/**
 * Fetches family members with cache-first and TTL optimization to prevent unnecessary backend calls.
 */
export const getFamilyMembers = async (forceRefresh = false): Promise<FamilyMember[]> => {
  const token = await getValidAccessToken();

  if (!token) {
    return getCachedFamilyMembers();
  }

  if (!forceRefresh) {
    const fresh = await isCacheFresh();
    if (fresh) {
      const cached = await getCachedFamilyMembers();
      if (cached.length > 0) {
        return cached;
      }
    }
  }

  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      const remote = await fetchFamilyMembersFromApi();

      // If server has no members but local storage has pre-existing client members,
      // seamlessly migrate them to the database so existing data is preserved.
      if (remote.length === 0) {
        const cached = await getCachedFamilyMembers();
        const clientOnly = cached.filter((m) => !isServerId(m.id));
        if (clientOnly.length > 0) {
          const synced: FamilyMember[] = [];
          for (const item of clientOnly) {
            try {
              const uploaded = await createFamilyMemberOnApi(item);
              synced.push(uploaded);
            } catch {
              synced.push(item);
            }
          }
          await saveFamilyMembers(synced);
          await markSynced();
          return synced;
        }
      }

      await saveFamilyMembers(remote);
      await markSynced();
      return remote;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }
      // On network failure or offline, cleanly return local cache
      return getCachedFamilyMembers();
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
};

/**
 * Creates or updates a family member on the backend database if authenticated,
 * and keeps AsyncStorage cache in sync.
 */
export const upsertFamilyMember = async (
  member: (FamilyMemberFormData & { id?: string }) | FamilyMember,
): Promise<FamilyMember> => {
  const token = await getValidAccessToken();
  let savedMember: FamilyMember;

  if (token) {
    try {
      if (member.id && isServerId(member.id)) {
        savedMember = await updateFamilyMemberOnApi(member.id, member as FamilyMemberFormData);
      } else {
        savedMember = await createFamilyMemberOnApi(member as FamilyMemberFormData);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw err;
      }
      // On network failure, fallback to local storage so user input is never lost
      const now = new Date().toISOString();
      savedMember = {
        id: member.id || `fam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: member.name.trim(),
        relationship: member.relationship,
        gender: member.gender,
        ageYears: member.ageYears,
        bloodGroup: member.bloodGroup,
        allergies: member.allergies || [],
        conditions: member.conditions || [],
        currentMedicines: (member.currentMedicines || '').trim(),
        createdAt: (member as FamilyMember).createdAt || now,
        updatedAt: now,
      };
    }
  } else {
    // Offline / guest fallback
    const now = new Date().toISOString();
    savedMember = {
      id: member.id || `fam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: member.name.trim(),
      relationship: member.relationship,
      gender: member.gender,
      ageYears: member.ageYears,
      bloodGroup: member.bloodGroup,
      allergies: member.allergies || [],
      conditions: member.conditions || [],
      currentMedicines: (member.currentMedicines || '').trim(),
      createdAt: (member as FamilyMember).createdAt || now,
      updatedAt: now,
    };
  }

  // Update local cache
  const cached = await getCachedFamilyMembers();
  const index = cached.findIndex((item) => item.id === savedMember.id || (member.id && item.id === member.id));

  let next: FamilyMember[];
  if (index >= 0) {
    next = cached.map((item, i) => (i === index ? savedMember : item));
  } else {
    next = [...cached, savedMember];
  }

  await saveFamilyMembers(next);
  await markSynced();
  return savedMember;
};

/**
 * Deletes a member locally (server-side DELETE endpoint will be added in a future phase).
 */
export const deleteFamilyMember = async (
  id: string,
): Promise<FamilyMember | null> => {
  const existing = await getCachedFamilyMembers();
  const removed = existing.find((item) => item.id === id) ?? null;
  await saveFamilyMembers(existing.filter((item) => item.id !== id));
  return removed;
};
