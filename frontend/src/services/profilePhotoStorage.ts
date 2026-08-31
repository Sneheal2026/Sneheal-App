import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { devLog } from '@/utils/devLogger';

const PROFILE_PHOTO_KEY = '@sneheal/profile_photo';

/**
 * How the user's avatar is represented:
 * - `default`  → generic account icon (no image chosen yet)
 * - `male`     → built-in male illustration
 * - `female`   → built-in female illustration
 * - `custom`   → a user-provided photo persisted under `uri`
 */
export type ProfilePhotoType = 'default' | 'male' | 'female' | 'custom';

export interface ProfilePhotoSelection {
  type: ProfilePhotoType;
  /** Only set when `type === 'custom'`. Absolute file:// path in the app sandbox. */
  uri?: string;
}

export const DEFAULT_PROFILE_PHOTO: ProfilePhotoSelection = { type: 'default' };

// Folder inside the app sandbox where we keep persisted custom avatars.
const PROFILE_PHOTO_DIR = `${FileSystem.documentDirectory}profile-photos/`;

const isProfilePhotoType = (value: unknown): value is ProfilePhotoType =>
  value === 'default' || value === 'male' || value === 'female' || value === 'custom';

const parseSelection = (raw: string | null): ProfilePhotoSelection => {
  if (!raw) return DEFAULT_PROFILE_PHOTO;

  try {
    const parsed = JSON.parse(raw) as Partial<ProfilePhotoSelection>;
    if (!isProfilePhotoType(parsed.type)) return DEFAULT_PROFILE_PHOTO;

    if (parsed.type === 'custom') {
      if (typeof parsed.uri !== 'string' || parsed.uri.length === 0) {
        return DEFAULT_PROFILE_PHOTO;
      }
      return { type: 'custom', uri: parsed.uri };
    }

    return { type: parsed.type };
  } catch (error) {
    devLog('ProfilePhoto', 'Failed to parse stored selection', error);
    return DEFAULT_PROFILE_PHOTO;
  }
};

export const getProfilePhoto = async (): Promise<ProfilePhotoSelection> => {
  const raw = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
  const selection = parseSelection(raw);

  // Guard against a stored custom photo whose file was removed by the OS.
  if (selection.type === 'custom' && selection.uri) {
    try {
      const info = await FileSystem.getInfoAsync(selection.uri);
      if (!info.exists) {
        await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
        return DEFAULT_PROFILE_PHOTO;
      }
    } catch (error) {
      devLog('ProfilePhoto', 'Failed to verify custom photo file', error);
    }
  }

  return selection;
};

const ensureDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(PROFILE_PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROFILE_PHOTO_DIR, { intermediates: true });
  }
};

const removeExistingCustomFiles = async (): Promise<void> => {
  try {
    const info = await FileSystem.getInfoAsync(PROFILE_PHOTO_DIR);
    if (!info.exists) return;
    const files = await FileSystem.readDirectoryAsync(PROFILE_PHOTO_DIR);
    await Promise.all(
      files.map((name) =>
        FileSystem.deleteAsync(`${PROFILE_PHOTO_DIR}${name}`, { idempotent: true }),
      ),
    );
  } catch (error) {
    devLog('ProfilePhoto', 'Failed to clean old custom photos', error);
  }
};

/**
 * Copies a freshly picked image into the app sandbox so it survives cache
 * clears, then persists the selection. Returns the stored selection (with the
 * stable sandbox uri) so callers can render it immediately.
 */
export const saveCustomProfilePhoto = async (
  sourceUri: string,
): Promise<ProfilePhotoSelection> => {
  await ensureDir();
  // Only ever keep one custom avatar around.
  await removeExistingCustomFiles();

  const extensionMatch = /\.(\w+)(?:\?.*)?$/.exec(sourceUri);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  const destUri = `${PROFILE_PHOTO_DIR}avatar-${Date.now()}.${extension}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  const selection: ProfilePhotoSelection = { type: 'custom', uri: destUri };
  await AsyncStorage.setItem(PROFILE_PHOTO_KEY, JSON.stringify(selection));
  return selection;
};

/** Persists a preset (male/female) or the default account icon. */
export const saveProfilePhotoPreset = async (
  type: Exclude<ProfilePhotoType, 'custom'>,
): Promise<ProfilePhotoSelection> => {
  // Drop any previously stored custom file to reclaim space.
  await removeExistingCustomFiles();

  const selection: ProfilePhotoSelection = { type };
  await AsyncStorage.setItem(PROFILE_PHOTO_KEY, JSON.stringify(selection));
  return selection;
};

/**
 * Removes the stored selection and any persisted custom photo file. Called on
 * logout so the next user doesn't inherit the previous avatar.
 */
export const clearProfilePhoto = async (): Promise<void> => {
  await removeExistingCustomFiles();
  await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
};
