import { useCallback, useState } from 'react';
import {
  deleteFamilyMember,
  getCachedFamilyMembers,
  getFamilyMembers,
  upsertFamilyMember,
} from '@/services/familyMemberStorage';
import type {
  FamilyMember,
  FamilyMemberFormData,
} from '@/types/family.types';

export const useFamilyMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (forceRefresh = false) => {
    try {
      // If we don't have members in memory yet, prime with cache immediately to avoid empty screen flicker
      const cached = await getCachedFamilyMembers();
      if (cached.length > 0) {
        setMembers(cached);
        setLoading(false);
      }
      const next = await getFamilyMembers(forceRefresh);
      setMembers(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (data: FamilyMemberFormData) => {
    const member = await upsertFamilyMember(data);
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === member.id);
      if (idx >= 0) {
        return prev.map((m, i) => (i === idx ? member : m));
      }
      return [...prev, member];
    });
    return member;
  }, []);

  const updateMember = useCallback(
    async (id: string, data: FamilyMemberFormData) => {
      const updated = await upsertFamilyMember({ ...data, id });
      setMembers((prev) =>
        prev.map((item) => (item.id === id || item.id === updated.id ? updated : item)),
      );
      return updated;
    },
    [],
  );

  const removeMember = useCallback(async (id: string) => {
    await deleteFamilyMember(id);
    setMembers((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    members,
    loading,
    refresh,
    addMember,
    updateMember,
    removeMember,
  };
};
