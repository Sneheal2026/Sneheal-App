import type {
  BloodGroup,
  FamilyGender,
  FamilyRelationship,
} from '@/types/family.types';

export const FAMILY_RELATIONSHIPS: {
  id: FamilyRelationship;
  label: string;
}[] = [
  { id: 'self', label: 'Myself' },
  { id: 'spouse', label: 'Spouse' },
  { id: 'parent', label: 'Parent' },
  { id: 'child', label: 'Child' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'other', label: 'Other' },
];

export const FAMILY_GENDERS: { id: FamilyGender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'unknown',
];

export const COMMON_ALLERGIES = [
  'None',
  'Penicillin',
  'Sulfa drugs',
  'Aspirin / NSAIDs',
  'Ibuprofen',
  'Dust',
  'Pollen',
  'Food (nuts / dairy)',
  'Other',
] as const;

export const COMMON_CONDITIONS = [
  'None',
  'Diabetes',
  'High blood pressure',
  'Asthma',
  'Thyroid',
  'Heart disease',
  'Kidney disease',
  'Arthritis',
  'Other',
] as const;

export const getRelationshipLabel = (id: FamilyRelationship): string =>
  FAMILY_RELATIONSHIPS.find((item) => item.id === id)?.label ?? id;

export const getGenderLabel = (id: FamilyGender | null): string | null => {
  if (!id) return null;
  return FAMILY_GENDERS.find((item) => item.id === id)?.label ?? id;
};

export const getBloodGroupLabel = (id: BloodGroup | null): string | null => {
  if (!id) return null;
  return id === 'unknown' ? 'Unknown' : id;
};
