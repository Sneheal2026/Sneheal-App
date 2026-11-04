import { authenticatedApiRequest } from './authTokenManager';
import type { CartLine } from '@/types/cart.types';
import type { CartQuote } from '@/types/cartQuote.types';

export const fetchCartQuote = (
  lines: CartLine[],
  couponCode?: string | null,
): Promise<CartQuote> =>
  authenticatedApiRequest<CartQuote>('/api/cart/quote', {
    method: 'POST',
    body: {
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
      ...(couponCode ? { couponCode } : {}),
    },
  });
