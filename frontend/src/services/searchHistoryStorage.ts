import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@sneheal/searchHistory';
const MAX_ENTRIES = 8;

const parseHistory = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const getSearchHistory = async (): Promise<string[]> =>
  parseHistory(await AsyncStorage.getItem(HISTORY_KEY));

/** Adds a term to the top of the history and returns the updated list. */
export const addSearchTerm = async (term: string): Promise<string[]> => {
  const trimmed = term.trim();
  if (!trimmed) return getSearchHistory();

  const existing = await getSearchHistory();
  const deduped = existing.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  const updated = [trimmed, ...deduped].slice(0, MAX_ENTRIES);

  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

export const clearSearchHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};
