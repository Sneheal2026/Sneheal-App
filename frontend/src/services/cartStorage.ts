import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine } from '@/types/cart.types';
import type { CartQuote } from '@/types/cartQuote.types';

export const CART_STORAGE_KEY = '@sneheal/cart';
export const CART_QUOTE_STORAGE_KEY = '@sneheal/cart_quote';

const parseLines = (raw: string | null): CartLine[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        line &&
        typeof line.productId === 'string' &&
        typeof line.name === 'string' &&
        typeof line.price === 'number' &&
        typeof line.quantity === 'number' &&
        line.quantity > 0,
    );
  } catch {
    return [];
  }
};

export const getCartLines = async (): Promise<CartLine[]> => {
  const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return parseLines(raw);
};

export const saveCartLines = async (lines: CartLine[]): Promise<void> => {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
};

export const clearCartLines = async (): Promise<void> => {
  await AsyncStorage.multiRemove([CART_STORAGE_KEY, CART_QUOTE_STORAGE_KEY]);
};

export const getStoredQuote = async (): Promise<CartQuote | null> => {
  try {
    const raw = await AsyncStorage.getItem(CART_QUOTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.bill && typeof parsed.bill.grandTotal === 'number') {
      return parsed as CartQuote;
    }
    return null;
  } catch {
    return null;
  }
};

export const saveStoredQuote = async (quote: CartQuote | null): Promise<void> => {
  try {
    if (!quote) {
      await AsyncStorage.removeItem(CART_QUOTE_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(CART_QUOTE_STORAGE_KEY, JSON.stringify(quote));
    }
  } catch {
    // Ignore storage write failures
  }
};
