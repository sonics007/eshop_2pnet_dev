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
  vatRate?: number;
};

type AddItemOptions = {
  price?: number;
  currency?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, options?: AddItemOptions) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  totals: {
    currency: string;
    subtotal: number;
    vat: number;
    total: number;
    breakdown: Record<string, { subtotal: number; vat: number; total: number }>;
    vatByRate: Record<string, number>;
  };
};

const storageKey = 'eshop-cart-items';

const normaliseCurrency = (value?: string) => {
  if (!value) return 'EUR';
  const sanitized = value.replace(/[^A-Za-z]/g, '').toUpperCase();
  return sanitized || 'EUR';
};

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

  const addItem = (product: Product, quantity = 1, options?: AddItemOptions) => {
    const resolvedPrice = options?.price ?? product.price ?? 0;
    const resolvedCurrency = normaliseCurrency(options?.currency ?? product.currency);
    const resolvedVat = product.vatRate ?? 20;
    persist((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) => {
          if (item.slug !== product.slug) return item;
          if (item.currency === resolvedCurrency && item.price === resolvedPrice) {
            return { ...item, quantity: item.quantity + quantity, vatRate: item.vatRate ?? resolvedVat };
          }
          return {
            ...item,
            quantity: item.quantity + quantity,
            price: resolvedPrice,
            currency: resolvedCurrency,
            vatRate: item.vatRate ?? resolvedVat
          };
        });
      }
      return [
        ...current,
        {
          slug: product.slug,
          name: product.name,
          price: resolvedPrice,
          currency: resolvedCurrency,
          quantity,
          image: product.image,
          vatRate: resolvedVat
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
    const breakdown = items.reduce<Record<string, { subtotal: number; vat: number; total: number }>>((acc, item) => {
      const currency = item.currency || 'EUR';
      if (!acc[currency]) {
        acc[currency] = { subtotal: 0, vat: 0, total: 0 };
      }
      const line = item.price * item.quantity;
      const vatRate = typeof item.vatRate === 'number' ? item.vatRate : 20;
      acc[currency].subtotal += line;
      acc[currency].vat += line * (vatRate / 100);
      return acc;
    }, {});

    Object.values(breakdown).forEach((entry) => {
      entry.total = entry.subtotal + entry.vat;
    });

    const vatByRate = items.reduce<Record<string, number>>((acc, item) => {
      const vatRate = typeof item.vatRate === 'number' ? item.vatRate : 20;
      const key = `${vatRate}%`;
      const line = item.price * item.quantity;
      acc[key] = (acc[key] ?? 0) + line * (vatRate / 100);
      return acc;
    }, {});

    const primaryCurrency = items[0]?.currency || 'EUR';
    const summary = breakdown[primaryCurrency] ?? { subtotal: 0, vat: 0, total: 0 };

    return {
      currency: primaryCurrency,
      subtotal: summary.subtotal,
      vat: summary.vat,
      total: summary.total,
      breakdown,
      vatByRate
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
