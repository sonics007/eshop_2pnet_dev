'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@/types/product';

type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
};

const storageKey = 'eshop-cart-items';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        setItems([]);
      }
    }
  }, []);

  const persist = (updater: (current: CartItem[]) => CartItem[]) => {
    setItems((current) => {
      const nextItems = updater(current);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
      }
      return nextItems;
    });
  };

  const addItem = (product: Product, quantity = 1) => {
    persist((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === product.slug ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...current,
        {
          slug: product.slug,
          name: product.name,
          price: product.price,
          currency: product.currency,
          quantity,
          image: product.image
        }
      ];
    });
  };

  const updateQuantity = (slug: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(slug);
      return;
    }
    persist((current) => current.map((item) => (item.slug === slug ? { ...item, quantity } : item)));
  };

  const removeItem = (slug: string) => {
    persist((current) => current.filter((item) => item.slug !== slug));
  };

  const clearCart = () => {
    persist(() => []);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const vat = subtotal * 0.2;
    return {
      subtotal,
      vat,
      total: subtotal + vat
    };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
