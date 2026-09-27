export const FREE_DELIVERY_THRESHOLD = 50;
export const DELIVERY_FEE = 4.99;

export function calculateShippingFee(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_FEE;
}
