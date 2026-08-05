import type { ImageSourcePropType } from 'react-native';

export interface ProductHighlight {
  icon: string;
  label: string;
}

/** Raw product shape returned by the catalog API. */
export interface ApiProduct {
  id: string;
  name: string;
  manufacturer: string;
  brandName: string | null;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  unit: string;
  rating: number;
  reviews: number;
  uses: string[];
  description: string;
  highlights: ProductHighlight[];
  categoryId: string | null;
  prescriptionRequired: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

/**
 * Client-side product. Extends the API shape with a resolved `image`
 * (URI when available, local placeholder otherwise) so existing UI
 * components can render `source={item.image}` without changes.
 */
export interface Product extends Omit<ApiProduct, 'originalPrice'> {
  originalPrice?: number;
  image: ImageSourcePropType;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  offerLabel: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Category extends ApiCategory {
  image: ImageSourcePropType;
}
