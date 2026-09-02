import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCategories,
  fetchProductById,
  fetchProducts,
  fetchProductsPage,
  fetchSimilarProducts,
  searchProductsPage,
} from '@/services/productService';
import type { Category, Product } from '@/types/product.types';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const ERROR_MESSAGE = 'Something went wrong. Please try again.';
const SEARCH_PAGE_SIZE = 20;

const toMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : ERROR_MESSAGE;

/** Featured products for the Home screen (small capped list). */
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
      const products = await fetchProducts({ featured: true, limit: 20 });
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

/**
 * Debounced product search with pagination / load-more.
 * - Waits `debounceMs` after typing stops before first page fetch
 * - `loadMore` appends the next page while `hasMore` is true
 */
export const useProductSearch = (query: string, debounceMs = 300) => {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      requestIdRef.current += 1;
      setItems([]);
      setTotal(0);
      setHasMore(false);
      hasMoreRef.current = false;
      offsetRef.current = 0;
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setItems([]);
    setTotal(0);
    setHasMore(false);
    hasMoreRef.current = false;
    offsetRef.current = 0;

    const timer = setTimeout(async () => {
      try {
        const page = await searchProductsPage(term, {
          limit: SEARCH_PAGE_SIZE,
          offset: 0,
        });

        if (requestId !== requestIdRef.current) return;

        setItems(page.items);
        setTotal(page.total);
        setHasMore(page.hasMore);
        hasMoreRef.current = page.hasMore;
        offsetRef.current = page.items.length;
        setLoading(false);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
        setTotal(0);
        setHasMore(false);
        hasMoreRef.current = false;
        offsetRef.current = 0;
        setLoading(false);
        setError(toMessage(err));
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  const loadMore = useCallback(async () => {
    const term = query.trim();
    if (!term || !hasMoreRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const requestId = requestIdRef.current;

    try {
      const page = await searchProductsPage(term, {
        limit: SEARCH_PAGE_SIZE,
        offset: offsetRef.current,
      });

      if (requestId !== requestIdRef.current) return;

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = page.items.filter((p) => !seen.has(p.id));
        const merged = [...prev, ...next];
        offsetRef.current = merged.length;
        return merged;
      });
      setTotal(page.total);
      setHasMore(page.hasMore);
      hasMoreRef.current = page.hasMore;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(toMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [query]);

  return {
    data: items,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
  };
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

const CATEGORY_PAGE_SIZE = 20;

/** Paginated products for a single category. */
export const useCategoryProducts = (categoryId: string) => {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    setTotal(0);
    setHasMore(false);
    hasMoreRef.current = false;
    offsetRef.current = 0;

    try {
      const page = await fetchProductsPage({
        categoryId,
        limit: CATEGORY_PAGE_SIZE,
        offset: 0,
      });
      if (!mountedRef.current) return;

      setItems(page.items);
      setTotal(page.total);
      setHasMore(page.hasMore);
      hasMoreRef.current = page.hasMore;
      offsetRef.current = page.items.length;
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;
      setLoading(false);
      setError(toMessage(err));
    }
  }, [categoryId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchProductsPage({
        categoryId,
        limit: CATEGORY_PAGE_SIZE,
        offset: offsetRef.current,
      });
      if (!mountedRef.current) return;

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = page.items.filter((p) => !seen.has(p.id));
        const merged = [...prev, ...next];
        offsetRef.current = merged.length;
        return merged;
      });
      setTotal(page.total);
      setHasMore(page.hasMore);
      hasMoreRef.current = page.hasMore;
    } catch (err) {
      if (!mountedRef.current) return;
      setError(toMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [categoryId]);

  return { data: items, total, hasMore, loading, loadingMore, error, refetch: load, loadMore };
};
