import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Haptics from 'expo-haptics';
import { getCartLines, saveCartLines } from '@/services/cartStorage';
import { MAX_CART_QTY, productToCartLine, type CartLine } from '@/types/cart.types';
import type { Product } from '@/types/product.types';

type CartContextValue = {
  ready: boolean;
  lines: CartLine[];
  totalItems: number;
  getQuantity: (productId: string) => number;
  addProduct: (product: Product) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getCartLines().then((stored) => {
      if (!active) return;
      setLines(stored);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveCartLines(lines);
  }, [lines, ready]);

  const getQuantity = useCallback(
    (productId: string) => lines.find((line) => line.productId === productId)?.quantity ?? 0,
    [lines],
  );

  const addProduct = useCallback((product: Product) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLines((prev) => {
      const index = prev.findIndex((line) => line.productId === product.id);
      if (index < 0) {
        return [...prev, productToCartLine(product, 1)];
      }
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        quantity: Math.min(MAX_CART_QTY, current.quantity + 1),
        price: product.price,
        originalPrice: product.originalPrice,
        name: product.name,
        unit: product.unit,
        imageUrl: product.imageUrl,
      };
      return next;
    });
  }, []);

  const increment = useCallback((productId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLines((prev) => {
      const index = prev.findIndex((line) => line.productId === productId);
      if (index < 0) return prev;
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        quantity: Math.min(MAX_CART_QTY, current.quantity + 1),
      };
      return next;
    });
  }, []);

  const decrement = useCallback((productId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLines((prev) => {
      const index = prev.findIndex((line) => line.productId === productId);
      if (index < 0) return prev;
      const current = prev[index];
      if (current.quantity <= 1) {
        return prev.filter((line) => line.productId !== productId);
      }
      const next = [...prev];
      next[index] = { ...current, quantity: current.quantity - 1 };
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      lines,
      totalItems,
      getQuantity,
      addProduct,
      increment,
      decrement,
      remove,
      clearCart,
    }),
    [ready, lines, totalItems, getQuantity, addProduct, increment, decrement, remove, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
