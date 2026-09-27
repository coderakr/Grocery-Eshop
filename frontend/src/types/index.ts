export type Role = 'customer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  unit: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  unitPrice: string;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  subtotal: string;
  shippingFee: string;
  total: string;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
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

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
