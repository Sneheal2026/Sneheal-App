export type FamilyRelationship =
  | 'self'
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'other';

export type FamilyGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'unknown';

export type FamilyMember = {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  gender: FamilyGender | null;
  ageYears: number | null;
  bloodGroup: BloodGroup | null;
  allergies: string[];
  conditions: string[];
  currentMedicines: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyMemberFormData = {
  name: string;
  relationship: FamilyRelationship;
  gender: FamilyGender | null;
  ageYears: number | null;
  bloodGroup: BloodGroup | null;
  allergies: string[];
  conditions: string[];
  currentMedicines: string;
};

export const createFamilyMemberId = (): string =>
  `fam_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
