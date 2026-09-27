import { api, unwrap } from './client';
import type { Cart, Order, OrderStatus } from '../types';

export function fetchCart() {
  return unwrap<Cart>(api.get('/cart'));
}

export function addToCart(productId: number, quantity = 1) {
  return unwrap<Cart>(api.post('/cart', { productId, quantity }));
}

export function updateCartItem(itemId: number, quantity: number) {
  return unwrap<Cart>(api.patch(`/cart/${itemId}`, { quantity }));
}

export function removeCartItem(itemId: number) {
  return unwrap<Cart>(api.delete(`/cart/${itemId}`));
}

export function clearCart() {
  return unwrap<Cart>(api.delete('/cart'));
}

export interface OrderInput {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note?: string | null;
}

export function createOrder(input: OrderInput) {
  return unwrap<Order>(api.post('/orders', input));
}

export function fetchMyOrders() {
  return unwrap<Order[]>(api.get('/orders'));
}

export function fetchMyOrder(id: number) {
  return unwrap<Order>(api.get(`/orders/${id}`));
}

export interface DashboardStats {
  revenue: number;
  weeklyRevenue: number;
  orders: number;
  products: number;
  users: number;
  pendingOrders: number;
  salesByStatus: { status: OrderStatus; count: number }[];
  recentOrders: Order[];
  lowStock: { id: number; name: string; stock: number }[];
}

export function fetchDashboardStats() {
  return unwrap<DashboardStats>(api.get('/admin/stats'));
}

export function fetchAllOrders(status?: OrderStatus) {
  return unwrap<Order[]>(
    api.get('/admin/orders', { params: status ? { status } : {} }),
  );
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  return unwrap<Order>(api.patch(`/admin/orders/${id}/status`, { status }));
}
