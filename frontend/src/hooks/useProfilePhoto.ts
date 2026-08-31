import { useCallback, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  DEFAULT_PROFILE_PHOTO,
  getProfilePhoto,
  type ProfilePhotoSelection,
  type ProfilePhotoType,
} from '@/services/profilePhotoStorage';
import { devLog } from '@/utils/devLogger';

const MALE_IMAGE = require('../../assets/images/Male_picture.webp');
const FEMALE_IMAGE = require('../../assets/images/Female_picture.webp');

/**
 * Resolves a stored selection to a renderable `<Image source>`.
 * Returns `null` for the `default` type so callers can render the account icon.
 */
export const resolveProfilePhotoSource = (
  selection: ProfilePhotoSelection,
): ImageSourcePropType | null => {
  switch (selection.type) {
    case 'male':
      return MALE_IMAGE;
    case 'female':
      return FEMALE_IMAGE;
    case 'custom':
      return selection.uri ? { uri: selection.uri } : null;
    case 'default':
    default:
      return null;
  }
};

export const PRESET_PROFILE_SOURCES: Record<'male' | 'female', ImageSourcePropType> = {
  male: MALE_IMAGE,
  female: FEMALE_IMAGE,
};

export interface UseProfilePhotoResult {
  selection: ProfilePhotoSelection;
  source: ImageSourcePropType | null;
  isDefault: boolean;
  loading: boolean;
  /** Update local state after a save so the UI reflects the new photo instantly. */
  setSelection: (selection: ProfilePhotoSelection) => void;
  reload: () => Promise<void>;
}

export const useProfilePhoto = (): UseProfilePhotoResult => {
  const [selection, setSelection] = useState<ProfilePhotoSelection>(DEFAULT_PROFILE_PHOTO);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const stored = await getProfilePhoto();
      setSelection(stored);
    } catch (error) {
      devLog('ProfilePhoto', 'Failed to load profile photo', error);
      setSelection(DEFAULT_PROFILE_PHOTO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    selection,
    source: resolveProfilePhotoSource(selection),
    isDefault: selection.type === 'default',
    loading,
    setSelection,
    reload,
  };
};

export type { ProfilePhotoSelection, ProfilePhotoType };
