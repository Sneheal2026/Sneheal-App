import type { FamilyGender, FamilyRelationship } from '@/types/family.types';
import type { TFunction } from 'i18next';

const RELATIONSHIP_KEYS: Record<FamilyRelationship, string> = {
  self: 'family.relSelf',
  spouse: 'family.relSpouse',
  parent: 'family.relParent',
  child: 'family.relChild',
  sibling: 'family.relSibling',
  other: 'family.relOther',
};

const GENDER_KEYS: Record<FamilyGender, string> = {
  male: 'family.genderMale',
  female: 'family.genderFemale',
  other: 'family.genderOther',
  prefer_not_to_say: 'family.genderPreferNot',
};

export const translateRelationship = (t: TFunction, id: FamilyRelationship): string =>
  t(RELATIONSHIP_KEYS[id]);

export const translateGender = (t: TFunction, id: FamilyGender | null): string | null => {
  if (!id) return null;
  return t(GENDER_KEYS[id]);
};
