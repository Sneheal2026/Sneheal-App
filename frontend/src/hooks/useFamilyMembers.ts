import { useCallback, useState } from 'react';
import {
  deleteFamilyMember,
  getFamilyMembers,
  upsertFamilyMember,
} from '@/services/familyMemberStorage';
import {
  createFamilyMemberId,
  type FamilyMember,
  type FamilyMemberFormData,
} from '@/types/family.types';

export const useFamilyMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getFamilyMembers();
      setMembers(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (data: FamilyMemberFormData) => {
    const now = new Date().toISOString();
    const member: FamilyMember = {
      id: createFamilyMemberId(),
      ...data,
      name: data.name.trim(),
      currentMedicines: data.currentMedicines.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await upsertFamilyMember(member);
    setMembers((prev) => [...prev, member]);
    return member;
  }, []);

  const updateMember = useCallback(
    async (id: string, data: FamilyMemberFormData) => {
      const existing = members.find((item) => item.id === id);
      if (!existing) return null;

      const updated: FamilyMember = {
        ...existing,
        ...data,
        name: data.name.trim(),
        currentMedicines: data.currentMedicines.trim(),
        updatedAt: new Date().toISOString(),
      };
      await upsertFamilyMember(updated);
      setMembers((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [members],
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
