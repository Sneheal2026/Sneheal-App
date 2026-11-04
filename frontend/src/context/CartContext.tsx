import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getCartLines, saveCartLines } from '@/services/cartStorage';
import { fetchCartQuote } from '@/services/cartQuoteService';
import { ApiError } from '@/services/apiClient';
import { MAX_CART_QTY, productToCartLine, type CartLine } from '@/types/cart.types';
import type { CartQuote } from '@/types/cartQuote.types';
import type { Product } from '@/types/product.types';

const QUOTE_DEBOUNCE_MS = 450;

export type AutoApplyToastPayload = {
  title: string;
  code: string | null;
  promoDiscount: number;
  deliveryUnlocked: boolean;
};

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
  quote: CartQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  couponDraft: string;
  setCouponDraft: (value: string) => void;
  applyCouponDraft: () => void;
  clearCoupon: () => void;
  couponApplyError: string | null;
  couponApplying: boolean;
  checkoutCouponCode: string | null;
  autoApplyToast: AutoApplyToastPayload | null;
  dismissAutoApplyToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const cartLinesKey = (lines: CartLine[]) =>
  lines
    .map((line) => `${line.productId}:${line.quantity}`)
    .sort()
    .join('|');

const COUPON_ERROR_DISMISS_MS = 3500;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [couponDraft, setCouponDraftState] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponApplyError, setCouponApplyError] = useState<string | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [autoApplyToast, setAutoApplyToast] = useState<AutoApplyToastPayload | null>(null);

  const quoteRequestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const couponErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedCouponRef = useRef<string | null>(null);
  const prevCartPromoId = useRef<string | null>(null);
  const prevDeliveryFree = useRef(false);

  appliedCouponRef.current = appliedCouponCode;

  const scheduleCouponErrorClear = useCallback((message: string) => {
    setCouponApplyError(message);
    if (couponErrorTimer.current) {
      clearTimeout(couponErrorTimer.current);
    }
    couponErrorTimer.current = setTimeout(() => {
      setCouponApplyError(null);
    }, COUPON_ERROR_DISMISS_MS);
  }, []);

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

  useEffect(
    () => () => {
      if (couponErrorTimer.current) {
        clearTimeout(couponErrorTimer.current);
      }
    },
    [],
  );

  const runQuote = useCallback(
    async (
      nextLines: CartLine[],
      couponCode: string | null,
      options: { background?: boolean } = {},
    ) => {
      if (nextLines.length === 0) {
        setQuote(null);
        setQuoteLoading(false);
        setQuoteError(null);
        prevCartPromoId.current = null;
        prevDeliveryFree.current = false;
        return;
      }

      const requestId = ++quoteRequestId.current;
      if (!options.background) {
        setQuoteLoading(true);
      }
      setQuoteError(null);

      try {
        const data = await fetchCartQuote(nextLines, couponCode);
        if (requestId !== quoteRequestId.current) return;
        setQuote(data);
        if (data.couponError) {
          scheduleCouponErrorClear(data.couponError);
        } else if (!couponCode) {
          setCouponApplyError(null);
        }
      } catch (err) {
        if (requestId !== quoteRequestId.current) return;
        const message =
          err instanceof ApiError ? err.message : 'Could not refresh cart totals';
        setQuoteError(message);
      } finally {
        if (requestId === quoteRequestId.current && !options.background) {
          setQuoteLoading(false);
        }
      }
    },
    [scheduleCouponErrorClear],
  );

  const linesKey = cartLinesKey(lines);

  useEffect(() => {
    if (!ready) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (lines.length === 0) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      void runQuote(lines, appliedCouponRef.current, { background: true });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [ready, linesKey, runQuote]);

  useEffect(() => {
    if (!quote || quoteLoading) return;

    const cartPromo = quote.bill.appliedCartPromotion;
    const cartId = cartPromo?.id ?? null;
    const deliveryFree = quote.bill.deliveryFree;
    const deliveryJustUnlocked = deliveryFree && !prevDeliveryFree.current;

    if (appliedCouponCode || quote.couponError) {
      prevCartPromoId.current = cartId;
      prevDeliveryFree.current = deliveryFree;
      return;
    }

    const cartNewlyApplied = Boolean(cartId && cartId !== prevCartPromoId.current);

    if (cartNewlyApplied || (deliveryJustUnlocked && quote.bill.appliedDeliveryPromotion)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAutoApplyToast({
        title: cartPromo?.title ?? quote.bill.appliedDeliveryPromotion?.title ?? '',
        code: cartPromo?.code ?? null,
        promoDiscount: quote.bill.promoDiscount,
        deliveryUnlocked: deliveryJustUnlocked,
      });
    }

    prevCartPromoId.current = cartId;
    prevDeliveryFree.current = deliveryFree;
  }, [quote, quoteLoading, appliedCouponCode]);

  const dismissAutoApplyToast = useCallback(() => {
    setAutoApplyToast(null);
  }, []);

  const setCouponDraft = useCallback((value: string) => {
    setCouponDraftState(value);
    if (couponErrorTimer.current) {
      clearTimeout(couponErrorTimer.current);
    }
    if (!value.trim()) {
      setCouponApplyError(null);
    }
  }, []);

  const applyCouponDraft = useCallback(() => {
    const trimmed = couponDraft.trim().toUpperCase();
    if (!trimmed) {
      setAppliedCouponCode(null);
      setCouponDraftState('');
      setCouponApplyError(null);
      void runQuote(lines, null, { background: true });
      return;
    }

    if (couponApplying) return;

    setCouponApplying(true);
    setCouponApplyError(null);
    if (couponErrorTimer.current) {
      clearTimeout(couponErrorTimer.current);
    }

    void (async () => {
      try {
        const data = await fetchCartQuote(lines, trimmed);
        setQuote(data);
        if (data.couponError) {
          setAppliedCouponCode(null);
          appliedCouponRef.current = null;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCouponDraftState('');
          scheduleCouponErrorClear(data.couponError);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          setAppliedCouponCode(trimmed);
          appliedCouponRef.current = trimmed;
          setCouponDraftState(trimmed);
          setCouponApplyError(null);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Could not apply coupon';
        scheduleCouponErrorClear(message);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCouponDraftState('');
        setAppliedCouponCode(null);
        appliedCouponRef.current = null;
      } finally {
        setCouponApplying(false);
      }
    })();
  }, [couponApplying, couponDraft, lines, runQuote, scheduleCouponErrorClear]);

  const clearCoupon = useCallback(() => {
    if (couponErrorTimer.current) {
      clearTimeout(couponErrorTimer.current);
    }
    setCouponDraftState('');
    setAppliedCouponCode(null);
    appliedCouponRef.current = null;
    setCouponApplyError(null);
    void runQuote(lines, null, { background: true });
  }, [lines, runQuote]);

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
    setQuote(null);
    clearCoupon();
  }, [clearCoupon]);

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const checkoutCouponCode =
    appliedCouponCode && quote && !quote.couponError ? appliedCouponCode : null;

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
      quote,
      quoteLoading,
      quoteError,
      couponDraft,
      setCouponDraft,
      applyCouponDraft,
      clearCoupon,
      couponApplyError,
      couponApplying,
      checkoutCouponCode,
      autoApplyToast,
      dismissAutoApplyToast,
    }),
    [
      ready,
      lines,
      totalItems,
      getQuantity,
      addProduct,
      increment,
      decrement,
      remove,
      clearCart,
      quote,
      quoteLoading,
      quoteError,
      couponDraft,
      setCouponDraft,
      applyCouponDraft,
      clearCoupon,
      couponApplyError,
      couponApplying,
      checkoutCouponCode,
      autoApplyToast,
      dismissAutoApplyToast,
    ],
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
