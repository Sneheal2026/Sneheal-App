import AsyncStorage from '@react-native-async-storage/async-storage';

export type StorageField = {
  key: string;
  label: string;
  /** Pretty display string; null means key is missing. */
  display: string | null;
  isEmpty: boolean;
  isMasked?: boolean;
};

export type StorageSection = {
  id: string;
  title: string;
  fields: StorageField[];
};

type KnownKeyDef = {
  key: string;
  label: string;
  mask?: boolean;
};

type KnownSectionDef = {
  id: string;
  title: string;
  keys: KnownKeyDef[];
};

const KNOWN_SECTIONS: KnownSectionDef[] = [
  {
    id: 'auth',
    title: 'Auth & Session',
    keys: [
      { key: '@sneheal/accessToken', label: 'Access token', mask: true },
      { key: '@sneheal/refreshToken', label: 'Refresh token', mask: true },
      { key: '@sneheal/user', label: 'User profile' },
    ],
  },
  {
    id: 'addresses',
    title: 'Addresses',
    keys: [
      { key: '@sneheal/savedAddresses', label: 'Saved addresses' },
      { key: '@sneheal/selectedAddressId', label: 'Selected address id' },
      { key: '@sneheal/addressesLastSyncAt', label: 'Addresses last sync' },
      { key: '@sneheal/selectedAddressId', label: 'Selected address ID' },
    ],
  },
  {
    id: 'reminders',
    title: 'Medicine Reminders',
    keys: [{ key: '@sneheal/medicineReminders', label: 'Reminders' }],
  },
  {
    id: 'family',
    title: 'Family Members',
    keys: [{ key: '@sneheal/familyMembers', label: 'Members' }],
  },
  {
    id: 'preferences',
    title: 'App Preferences',
    keys: [
      { key: '@sneheal/app_language', label: 'Language' },
      { key: '@sneheal/color_theme', label: 'Color theme' },
      { key: '@sneheal/custom_primary', label: 'Custom primary color' },
    ],
  },
];

const KNOWN_KEY_SET = new Set(
  KNOWN_SECTIONS.flatMap((section) => section.keys.map((item) => item.key)),
);

const maskSecret = (value: string): string => {
  if (value.length <= 12) {
    return `${value.slice(0, 2)}…(${value.length} chars)`;
  }
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
};

const formatValue = (raw: string | null, mask?: boolean): string | null => {
  if (raw === null) return null;
  if (raw === '') return '(empty string)';
  if (mask) return maskSecret(raw);

  try {
    const parsed: unknown = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
};

const buildField = (
  key: string,
  label: string,
  raw: string | null,
  mask?: boolean,
): StorageField => {
  const display = formatValue(raw, mask);
  return {
    key,
    label,
    display,
    isEmpty: raw === null,
    isMasked: Boolean(mask && raw),
  };
};

/** Loads all AsyncStorage entries grouped by known app sections. */
export const loadDevStorageDump = async (): Promise<{
  sections: StorageSection[];
  totalKeys: number;
  loadedAt: string;
}> => {
  const allKeys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(allKeys);
  const valueByKey = new Map(pairs.map(([key, value]) => [key, value]));

  const sections: StorageSection[] = KNOWN_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    fields: section.keys.map((item) =>
      buildField(item.key, item.label, valueByKey.get(item.key) ?? null, item.mask),
    ),
  }));

  const unknownKeys = allKeys.filter((key) => !KNOWN_KEY_SET.has(key)).sort();
  if (unknownKeys.length > 0) {
    sections.push({
      id: 'other',
      title: 'Other / Unknown Keys',
      fields: unknownKeys.map((key) =>
        buildField(key, key, valueByKey.get(key) ?? null),
      ),
    });
  }

  return {
    sections,
    totalKeys: allKeys.length,
    loadedAt: new Date().toLocaleString(),
  };
};
