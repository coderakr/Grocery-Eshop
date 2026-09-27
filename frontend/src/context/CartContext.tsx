import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import * as shopApi from '../api/shop';
import { getErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { Cart, CartItem } from '../types';

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  busyItemId: number | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY_CART: Cart = { items: [], subtotal: 0, itemCount: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      setCart(await shopApi.fetchCart());
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      if (!user) {
        toast.error('Please sign in to add items to your cart');
        throw new Error('unauthenticated');
      }
      try {
        const next = await shopApi.addToCart(productId, quantity);
        setCart(next);
        toast.success('Added to cart');
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [user, toast],
  );

  const setQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      setBusyItemId(itemId);
      try {
        setCart(await shopApi.updateCartItem(itemId, quantity));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setBusyItemId(null);
      }
    },
    [toast],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setBusyItemId(itemId);
      try {
        setCart(await shopApi.removeCartItem(itemId));
        toast.success('Removed from cart');
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setBusyItemId(null);
      }
    },
    [toast],
  );

  const clear = useCallback(async () => {
    try {
      setCart(await shopApi.clearCart());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [toast]);

  const value = useMemo<CartContextValue>(
    () => ({ cart, loading, busyItemId, addItem, setQuantity, removeItem, clear, refresh }),
    [cart, loading, busyItemId, addItem, setQuantity, removeItem, clear, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export type { CartItem };
