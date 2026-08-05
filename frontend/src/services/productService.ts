import { apiRequest } from './apiClient';
import { resolveCatalogImage } from '@/utils/productImage';
import type {
  ApiCategory,
  ApiProduct,
  ApiProductPage,
  Category,
  Product,
  ProductPage,
} from '@/types/product.types';

const toProduct = (raw: ApiProduct): Product => ({
  ...raw,
  originalPrice:
    raw.originalPrice != null && raw.originalPrice > 0
      ? raw.originalPrice
      : undefined,
  image: resolveCatalogImage(raw.imageUrl),
});

const toCategory = (raw: ApiCategory): Category => ({
  ...raw,
  image: resolveCatalogImage(raw.imageUrl),
});

const toPage = (raw: ApiProductPage): ProductPage => ({
  items: (raw.items ?? []).map(toProduct),
  total: Number(raw.total) || 0,
  limit: Number(raw.limit) || 20,
  offset: Number(raw.offset) || 0,
  hasMore: Boolean(raw.hasMore),
});

const buildQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const parts: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });

  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

export interface FetchProductsParams {
  featured?: boolean;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export const fetchProductsPage = async (
  params: FetchProductsParams = {},
): Promise<ProductPage> => {
  const query = buildQuery({
    featured: params.featured ? 'true' : undefined,
    categoryId: params.categoryId,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  const data = await apiRequest<ApiProductPage>(`/api/products${query}`);
  return toPage(data);
};

/** Convenience wrapper — returns only the items array (Home featured, etc.). */
export const fetchProducts = async (
  params: FetchProductsParams = {},
): Promise<Product[]> => {
  const page = await fetchProductsPage(params);
  return page.items;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const data = await apiRequest<ApiProduct>(`/api/products/${id}`);
  return toProduct(data);
};

export const searchProductsPage = async (
  query: string,
  params: { limit?: number; offset?: number } = {},
): Promise<ProductPage> => {
  const term = query.trim();
  if (!term) {
    return { items: [], total: 0, limit: params.limit ?? 20, offset: 0, hasMore: false };
  }

  const data = await apiRequest<ApiProductPage>(
    `/api/products/search${buildQuery({
      q: term,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    })}`,
  );
  return toPage(data);
};

/** @deprecated Prefer searchProductsPage for pagination. */
export const searchProducts = async (query: string): Promise<Product[]> => {
  const page = await searchProductsPage(query);
  return page.items;
};

export const fetchSimilarProducts = async (
  id: string,
  limit = 6,
): Promise<Product[]> => {
  const data = await apiRequest<ApiProduct[]>(
    `/api/products/${id}/similar${buildQuery({ limit })}`,
  );
  return data.map(toProduct);
};

export const fetchCategories = async (): Promise<Category[]> => {
  const data = await apiRequest<ApiCategory[]>('/api/categories');
  return data.map(toCategory);
};
