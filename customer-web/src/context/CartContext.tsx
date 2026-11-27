import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CartItem, Product, Shop } from '../types';

interface CartContextType {
  items: CartItem[];
  shop: Shop | null;
  shopId: string | null;
  subtotal: number;
  itemCount: number;
  addItem: (product: Product, shop: Shop, quantity?: number, notes?: string) => { success: boolean; conflictShopName?: string };
  confirmSwitchRestaurantAndAdd: (product: Product, shop: Shop, quantity?: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CART_STORAGE_KEY = 'yummy_customer_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed.items) ? parsed.items : [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [shop, setShop] = useState<Shop | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.shop || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items,
          shop,
        })
      );
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items, shop]);

  const shopId = shop?.id || (items.length > 0 ? items[0].product.shop_id : null);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (
    product: Product,
    targetShop: Shop,
    quantity = 1,
    notes = ''
  ): { success: boolean; conflictShopName?: string } => {
    // Single-restaurant rule check:
    if (items.length > 0 && shopId && shopId !== targetShop.id) {
      return {
        success: false,
        conflictShopName: shop?.name || 'another restaurant',
      };
    }

    setShop(targetShop);
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });

    return { success: true };
  };

  const confirmSwitchRestaurantAndAdd = (
    product: Product,
    targetShop: Shop,
    quantity = 1,
    notes = ''
  ) => {
    setShop(targetShop);
    setItems([{ product, quantity, notes }]);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.product.id !== productId);
      if (remaining.length === 0) {
        setShop(null);
      }
      return remaining;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setShop(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        shop,
        shopId,
        subtotal,
        itemCount,
        addItem,
        confirmSwitchRestaurantAndAdd,
        removeItem,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
