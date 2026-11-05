'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import catalogData from '@/data/catalog.json';
import type { EntityId, GeesCatalog } from '@/types/catalog';
import {
  buildCatalogLookup,
  resolveCartSubtotal,
  resolveLineTotalPrice,
  resolveLineUnitPrice,
  type CatalogLookup,
} from '@/lib/catalog-helpers';
import {
  cartActions,
  cartReducer,
  initialCartState,
  type CartLine,
  type CartState,
} from '@/context/cart-reducer';

const STORAGE_KEY = 'gees_burger_cart_v1';
const defaultCatalog = catalogData as GeesCatalog;

interface CartContextValue {
  state: CartState;
  isHydrated: boolean;
  totalItems: number;
  subtotal: number;
  lookup: CatalogLookup;
  getLineUnitPrice: (line: CartLine) => number;
  getLineTotalPrice: (line: CartLine) => number;
  getItemQuantityInCart: (
    itemId: EntityId,
    variantId?: EntityId | null,
    addOnIds?: EntityId[]
  ) => number;
  addItem: (input: {
    itemId: EntityId;
    variantId?: EntityId | null;
    addOnIds?: EntityId[];
    quantity?: number;
  }) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  toggleLineAddOn: (lineId: string, addOnId: EntityId) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [isHydrated, setIsHydrated] = useState(false);

  const lookup = useMemo(() => buildCatalogLookup(defaultCatalog), []);

  // Hydrate from localStorage in useEffect
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lines?: CartLine[] };
        if (Array.isArray(parsed.lines)) {
          const validLines = parsed.lines.filter(
            (l) =>
              l &&
              typeof l.itemId === 'string' &&
              lookup.itemsById.has(l.itemId) &&
              typeof l.quantity === 'number' &&
              l.quantity > 0
          );
          dispatch(cartActions.hydrate(validLines));
        }
      }
    } catch {
      // Ignore malformed storage
    } finally {
      setIsHydrated(true);
    }
  }, [lookup]);

  // Persist to localStorage in useEffect
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const serialized = JSON.stringify({
        lines: state.lines.map((l) => ({
          lineId: l.lineId,
          itemId: l.itemId,
          variantId: l.variantId,
          addOnIds: l.addOnIds,
          quantity: l.quantity,
          addedAt: l.addedAt,
        })),
      });
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore storage quota errors
    }
  }, [state.lines, isHydrated]);

  const addItem = useCallback(
    (input: {
      itemId: EntityId;
      variantId?: EntityId | null;
      addOnIds?: EntityId[];
      quantity?: number;
    }) => {
      dispatch(cartActions.addLine(input));
    },
    []
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    dispatch(cartActions.setQuantity(lineId, quantity));
  }, []);

  const removeLine = useCallback((lineId: string) => {
    dispatch(cartActions.removeLine(lineId));
  }, []);

  const toggleLineAddOn = useCallback((lineId: string, addOnId: EntityId) => {
    dispatch(cartActions.toggleLineAddOn(lineId, addOnId));
  }, []);

  const clearCart = useCallback(() => {
    dispatch(cartActions.clearCart());
  }, []);

  const getLineUnitPrice = useCallback(
    (line: CartLine) =>
      resolveLineUnitPrice(lookup, line.itemId, line.variantId, line.addOnIds),
    [lookup]
  );

  const getLineTotalPrice = useCallback(
    (line: CartLine) => resolveLineTotalPrice(lookup, line),
    [lookup]
  );

  const getItemQuantityInCart = useCallback(
    (
      itemId: EntityId,
      variantId?: EntityId | null,
      addOnIds?: EntityId[]
    ): number => {
      return state.lines.reduce((acc, line) => {
        if (line.itemId !== itemId) return acc;
        if (variantId !== undefined && line.variantId !== variantId) return acc;
        if (addOnIds !== undefined) {
          const sortedA = [...line.addOnIds].sort().join(',');
          const sortedB = [...addOnIds].sort().join(',');
          if (sortedA !== sortedB) return acc;
        }
        return acc + line.quantity;
      }, 0);
    },
    [state.lines]
  );

  const totalItems = useMemo(
    () => state.lines.reduce((acc, line) => acc + line.quantity, 0),
    [state.lines]
  );

  const subtotal = useMemo(
    () => resolveCartSubtotal(lookup, state.lines),
    [lookup, state.lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      isHydrated,
      totalItems,
      subtotal,
      lookup,
      getLineUnitPrice,
      getLineTotalPrice,
      getItemQuantityInCart,
      addItem,
      setQuantity,
      removeLine,
      toggleLineAddOn,
      clearCart,
    }),
    [
      state,
      isHydrated,
      totalItems,
      subtotal,
      lookup,
      getLineUnitPrice,
      getLineTotalPrice,
      getItemQuantityInCart,
      addItem,
      setQuantity,
      removeLine,
      toggleLineAddOn,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
