import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine } from '@/types/cart.types';

export const CART_STORAGE_KEY = '@sneheal/cart';

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
  await AsyncStorage.removeItem(CART_STORAGE_KEY);
};
