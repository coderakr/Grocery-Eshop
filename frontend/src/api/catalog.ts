import { api, unwrap } from './client';
import type { Category, Paginated, Product } from '../types';

export interface ProductQuery {
  search?: string;
  category?: string;
  categoryId?: number;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
  page?: number;
  limit?: number;
  all?: boolean;
}

export function fetchProducts(query: ProductQuery = {}) {
  const params: Record<string, string | number> = {};
  if (query.search) params.search = query.search;
  if (query.category) params.category = query.category;
  if (query.categoryId) params.categoryId = query.categoryId;
  if (query.featured !== undefined) params.featured = String(query.featured);
  if (query.minPrice !== undefined) params.minPrice = query.minPrice;
  if (query.maxPrice !== undefined) params.maxPrice = query.maxPrice;
  if (query.sort) params.sort = query.sort;
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;
  if (query.all) params.all = 'true';

  return unwrap<Paginated<Product>>(api.get('/products', { params }));
}

export function fetchProduct(idOrSlug: string) {
  return unwrap<{ product: Product; related: Product[] }>(
    api.get(`/products/${idOrSlug}`),
  );
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  unit?: string;
  stock?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: number | null;
}

export function createProduct(input: ProductInput) {
  return unwrap<Product>(api.post('/products', input));
}

export function updateProduct(id: number, input: Partial<ProductInput>) {
  return unwrap<Product>(api.patch(`/products/${id}`, input));
}

export function deleteProduct(id: number) {
  return unwrap<{ id: number }>(api.delete(`/products/${id}`));
}

export function fetchCategories() {
  return unwrap<Category[]>(api.get('/categories'));
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export function createCategory(input: CategoryInput) {
  return unwrap<Category>(api.post('/categories', input));
}

export function updateCategory(id: number, input: Partial<CategoryInput>) {
  return unwrap<Category>(api.patch(`/categories/${id}`, input));
}

export function deleteCategory(id: number) {
  return unwrap<{ id: number }>(api.delete(`/categories/${id}`));
}
