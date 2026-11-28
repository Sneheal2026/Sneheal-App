import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, LayoutAnimation, type AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import {
  getCartLines,
  saveCartLines,
  getStoredQuote,
  saveStoredQuote,
  getStoredRxMode,
  saveStoredRxMode,
} from '@/services/cartStorage';
import { fetchCartQuote } from '@/services/cartQuoteService';
import { ApiError } from '@/services/apiClient';
import { MAX_CART_QTY, productToCartLine, type CartLine } from '@/types/cart.types';
import type { CartQuote } from '@/types/cartQuote.types';
import type { Product } from '@/types/product.types';
import type { SavedPrescription } from '@/types/prescription';

const QUOTE_DEBOUNCE_MS = 250;

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
  refreshQuote: () => void;
  couponDraft: string;
  setCouponDraft: (value: string) => void;
  applyCouponDraft: () => void;
  clearCoupon: () => void;
  couponApplyError: string | null;
  couponApplying: boolean;
  checkoutCouponCode: string | null;
  autoApplyToast: AutoApplyToastPayload | null;
  dismissAutoApplyToast: () => void;
  hasRxItems: boolean;
  attachedPrescription: SavedPrescription | null;
  attachPrescription: (rx: SavedPrescription | null) => void;
  prescriptionMode: 'upload' | 'doctor_call' | null;
  setPrescriptionMode: (mode: 'upload' | 'doctor_call' | null) => void;
  isRxFulfilled: boolean;
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
  const [attachedPrescription, setAttachedPrescription] = useState<SavedPrescription | null>(null);
  const [prescriptionMode, setPrescriptionModeState] = useState<'upload' | 'doctor_call' | null>(null);

  const quoteRequestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const couponErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedCouponRef = useRef<string | null>(null);
  const prevCartPromoId = useRef<string | null>(null);
  const prevDeliveryFree = useRef(false);

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const quoteRef = useRef(quote);
  quoteRef.current = quote;
  const quoteErrorRef = useRef(quoteError);
  quoteErrorRef.current = quoteError;

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
    void Promise.all([getCartLines(), getStoredQuote(), getStoredRxMode()]).then(
      ([storedLines, storedQuote, storedMode]) => {
        if (!active) return;
        setLines(storedLines);
        if (storedQuote && storedLines.length > 0) {
          setQuote(storedQuote);
        }
        const hasRx = storedLines.some((l) => Boolean(l.prescriptionRequired));
        if (hasRx) {
          const mode = storedMode ?? 'doctor_call';
          setPrescriptionModeState(mode);
          void saveStoredRxMode(mode);
        } else {
          setPrescriptionModeState(null);
          void saveStoredRxMode(null);
        }
        setReady(true);
      },
    );
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
    ) => {
      if (nextLines.length === 0) {
        setQuote(null);
        setQuoteLoading(false);
        setQuoteError(null);
        prevCartPromoId.current = null;
        prevDeliveryFree.current = false;
        void saveStoredQuote(null);
        return;
      }

      const requestId = ++quoteRequestId.current;
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const data = await fetchCartQuote(nextLines, couponCode);
        if (requestId !== quoteRequestId.current) return;
        setQuote(data);
        void saveStoredQuote(data);
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
        if (requestId === quoteRequestId.current) {
          setQuoteLoading(false);
        }
      }
    },
    [scheduleCouponErrorClear],
  );

  const refreshQuote = useCallback(() => {
    if (!ready || linesRef.current.length === 0) return;
    void runQuote(linesRef.current, appliedCouponRef.current);
  }, [ready, runQuote]);

  useEffect(() => {
    if (!ready) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isOnline && linesRef.current.length > 0 && (!quoteRef.current || quoteErrorRef.current)) {
        void runQuote(linesRef.current, appliedCouponRef.current);
      }
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && linesRef.current.length > 0 && (!quoteRef.current || quoteErrorRef.current)) {
        void runQuote(linesRef.current, appliedCouponRef.current);
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [ready, runQuote]);

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

    // Immediately flag that cart calculation is in-flight so checkout cannot race ahead
    setQuoteLoading(true);

    debounceTimer.current = setTimeout(() => {
      void runQuote(lines, appliedCouponRef.current);
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
      void runQuote(lines, null);
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
    void runQuote(lines, null);
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
        prescriptionRequired: Boolean(product.prescriptionRequired),
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

  const setPrescriptionMode = useCallback((mode: 'upload' | 'doctor_call' | null) => {
    setPrescriptionModeState(mode);
    void saveStoredRxMode(mode);
    if (mode === 'doctor_call') {
      // User opted for doctor call - prescription will be provided by consultation
    } else if (mode === null) {
      setAttachedPrescription(null);
    }
  }, []);

  const attachPrescription = useCallback((rx: SavedPrescription | null) => {
    setAttachedPrescription(rx);
    if (rx) {
      setPrescriptionModeState('upload');
      void saveStoredRxMode('upload');
    }
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setQuote(null);
    setAttachedPrescription(null);
    setPrescriptionModeState(null);
    void saveStoredRxMode(null);
    clearCoupon();
    void saveStoredQuote(null);
  }, [clearCoupon]);

  const hasRxItems = useMemo(
    () => lines.some((line) => Boolean(line.prescriptionRequired)) || Boolean(quote?.hasPrescriptionItems),
    [lines, quote?.hasPrescriptionItems],
  );

  // When cart becomes empty or no prescription items remain, reset prescription mode.
  // When prescription items are present, auto-select doctor_call by default for frictionless checkout.
  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0 || !hasRxItems) {
      setAttachedPrescription(null);
      setPrescriptionModeState(null);
      void saveStoredRxMode(null);
    } else if (hasRxItems && !attachedPrescription && !prescriptionMode) {
      setPrescriptionModeState('doctor_call');
      void saveStoredRxMode('doctor_call');
    }
  }, [lines.length, hasRxItems, ready, attachedPrescription, prescriptionMode]);

  const isRxFulfilled = useMemo(() => {
    if (!hasRxItems) return true;
    if (prescriptionMode === 'doctor_call') return true;
    if (prescriptionMode === 'upload' && attachedPrescription != null) return true;
    if (attachedPrescription != null) return true;
    return false;
  }, [hasRxItems, prescriptionMode, attachedPrescription]);

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
      refreshQuote,
      couponDraft,
      setCouponDraft,
      applyCouponDraft,
      clearCoupon,
      couponApplyError,
      couponApplying,
      checkoutCouponCode,
      autoApplyToast,
      dismissAutoApplyToast,
      hasRxItems,
      attachedPrescription,
      attachPrescription,
      prescriptionMode,
      setPrescriptionMode,
      isRxFulfilled,
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
      refreshQuote,
      couponDraft,
      setCouponDraft,
      applyCouponDraft,
      clearCoupon,
      couponApplyError,
      couponApplying,
      checkoutCouponCode,
      autoApplyToast,
      dismissAutoApplyToast,
      hasRxItems,
      attachedPrescription,
      attachPrescription,
      prescriptionMode,
      setPrescriptionMode,
      isRxFulfilled,
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
