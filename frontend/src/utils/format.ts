export const FREE_DELIVERY_THRESHOLD = 50;
export const DELIVERY_FEE = 4.99;

export function calculateShippingFee(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_FEE;
}

export function formatCurrency(value: number | string): string {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function discountPercent(price: string, compareAt: string | null) {
  if (!compareAt) return null;
  const original = Number.parseFloat(compareAt);
  const current = Number.parseFloat(price);
  if (!original || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
