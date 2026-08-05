import { apiRequest } from './apiClient';
import { resolveCatalogImage } from '@/utils/productImage';
import type {
  ApiCategory,
  ApiProduct,
  Category,
  Product,
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

export const fetchProducts = async (
  params: FetchProductsParams = {},
): Promise<Product[]> => {
  const query = buildQuery({
    featured: params.featured ? 'true' : undefined,
    categoryId: params.categoryId,
    limit: params.limit,
    offset: params.offset,
  });

  const data = await apiRequest<ApiProduct[]>(`/api/products${query}`);
  return data.map(toProduct);
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const data = await apiRequest<ApiProduct>(`/api/products/${id}`);
  return toProduct(data);
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const term = query.trim();
  if (!term) return [];

  const data = await apiRequest<ApiProduct[]>(
    `/api/products/search${buildQuery({ q: term })}`,
  );
  return data.map(toProduct);
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
