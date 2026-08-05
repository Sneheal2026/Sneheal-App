import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCategories,
  fetchProductById,
  fetchProducts,
  fetchSimilarProducts,
  searchProducts,
} from '@/services/productService';
import type { Category, Product } from '@/types/product.types';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const ERROR_MESSAGE = 'Something went wrong. Please try again.';

const toMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : ERROR_MESSAGE;

/** Featured products for the Home screen. */
export const useFeaturedProducts = () => {
  const [state, setState] = useState<AsyncState<Product[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const products = await fetchProducts({ featured: true });
      if (mounted.current) {
        setState({ data: products, loading: false, error: null });
      }
    } catch (error) {
      if (mounted.current) {
        setState({ data: [], loading: false, error: toMessage(error) });
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, refetch: load };
};

/** Single product details. */
export const useProductDetails = (productId: string) => {
  const [state, setState] = useState<AsyncState<Product | null>>({
    data: null,
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const product = await fetchProductById(productId);
      if (mounted.current) {
        setState({ data: product, loading: false, error: null });
      }
    } catch (error) {
      if (mounted.current) {
        setState({ data: null, loading: false, error: toMessage(error) });
      }
    }
  }, [productId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, refetch: load };
};

/** Similar products for a given product. */
export const useSimilarProducts = (productId: string, limit = 6) => {
  const [state, setState] = useState<AsyncState<Product[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const products = await fetchSimilarProducts(productId, limit);
        if (mounted.current) {
          setState({ data: products, loading: false, error: null });
        }
      } catch (error) {
        if (mounted.current) {
          setState({ data: [], loading: false, error: toMessage(error) });
        }
      }
    };

    void load();

    return () => {
      mounted.current = false;
    };
  }, [productId, limit]);

  return state;
};

/** Debounced product search. */
export const useProductSearch = (query: string, debounceMs = 300) => {
  const [state, setState] = useState<AsyncState<Product[]>>({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const products = await searchProducts(term);
        if (active) {
          setState({ data: products, loading: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState({ data: [], loading: false, error: toMessage(error) });
        }
      }
    }, debounceMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return state;
};

/** Active catalog categories. */
export const useCategories = () => {
  const [state, setState] = useState<AsyncState<Category[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const categories = await fetchCategories();
      if (mounted.current) {
        setState({ data: categories, loading: false, error: null });
      }
    } catch (error) {
      if (mounted.current) {
        setState({ data: [], loading: false, error: toMessage(error) });
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, refetch: load };
};
