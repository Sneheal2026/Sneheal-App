import type { Product } from './product.types';

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  unit: string;
  imageUrl: string | null;
  price: number;
  originalPrice?: number;
}

export const MAX_CART_QTY = 10;

export const productToCartLine = (product: Product, quantity = 1): CartLine => ({
  productId: product.id,
  quantity,
  name: product.name,
  unit: product.unit,
  imageUrl: product.imageUrl,
  price: product.price,
  originalPrice: product.originalPrice,
});
