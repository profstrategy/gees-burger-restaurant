'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { alertEvents } from '@/lib/alert-events';
import { getCatalogIndex } from '@/lib/catalog-index';
import { actions, type AppAction } from '@/state/actions';
import { initialState } from '@/state/initialState';
import { rootReducer } from '@/state/reducer';
import type { CatalogIndexLike } from '@/state/selectors';
import {
  buildCartLineKey,
  clampCartQty,
} from '@/state/slices/cart.reducer';
import type {
  AlertsState,
  CartAddOn,
  CartLine,
  CartState,
  CatalogFilterState,
} from '@/state/types';

export const CART_STORAGE_KEY = 'gees.cart.v1';
export const CART_STORAGE_VERSION = 1;

interface PersistedCartPayload {
  version: number;
  lines: CartLine[];
}

export interface HydrateValidationResult {
  validLines: CartLine[];
  droppedCount: number;
}

/**
 * Pure validation helper for cart hydration against the catalog index:
 * Drops any line whose item, variant, or add-on is missing from the catalog or `stock_out`.
 */
export function validateCartLinesAgainstCatalog(
  rawLines: unknown,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): HydrateValidationResult {
  if (!Array.isArray(rawLines)) {
    return { validLines: [], droppedCount: 0 };
  }

  const validLines: CartLine[] = [];
  let droppedCount = 0;

  for (const raw of rawLines) {
    if (!raw || typeof raw !== 'object') {
      droppedCount += 1;
      continue;
    }

    const candidate = raw as Partial<CartLine>;
    if (
      typeof candidate.itemId !== 'string' ||
      typeof candidate.qty !== 'number' ||
      candidate.qty <= 0
    ) {
      droppedCount += 1;
      continue;
    }

    const item = catalogIndex.itemsById.get(candidate.itemId);
    if (!item || item.status === 'stock_out') {
      droppedCount += 1;
      continue;
    }

    const itemVariants = catalogIndex.variantsByItemId.get(item.id) ?? [];
    const variantId = candidate.variantId ?? null;

    if (itemVariants.length > 0) {
      if (!variantId) {
        droppedCount += 1;
        continue;
      }
      const matchedVariant = itemVariants.find((v) => v.id === variantId);
      if (!matchedVariant || matchedVariant.status === 'stock_out') {
        droppedCount += 1;
        continue;
      }
    } else if (variantId !== null) {
      droppedCount += 1;
      continue;
    }

    // Validate add-ons on the line
    const rawAddOns = Array.isArray(candidate.addOns) ? candidate.addOns : [];
    const validatedAddOns: CartAddOn[] = [];
    let hasInvalidAddOn = false;

    for (const rawAddOn of rawAddOns) {
      if (
        !rawAddOn ||
        typeof rawAddOn !== 'object' ||
        typeof rawAddOn.addOnId !== 'string' ||
        typeof rawAddOn.qty !== 'number' ||
        rawAddOn.qty <= 0
      ) {
        hasInvalidAddOn = true;
        break;
      }
      if (!item.addOnId.includes(rawAddOn.addOnId)) {
        hasInvalidAddOn = true;
        break;
      }
      const catalogAddOn = catalogIndex.addOnsById.get(rawAddOn.addOnId);
      if (!catalogAddOn || catalogAddOn.status === 'stock_out') {
        hasInvalidAddOn = true;
        break;
      }
      validatedAddOns.push({
        addOnId: rawAddOn.addOnId,
        qty: clampCartQty(rawAddOn.qty),
      });
    }

    if (hasInvalidAddOn) {
      droppedCount += 1;
      continue;
    }

    validLines.push({
      key: buildCartLineKey(item.id, variantId),
      itemId: item.id,
      variantId,
      qty: clampCartQty(candidate.qty),
      addOns: validatedAddOns,
    });
  }

  return { validLines, droppedCount };
}

export function findCatalogConflictsForCartLines(
  lines: ReadonlyArray<CartLine>,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): Record<string, string> {
  const conflicts: Record<string, string> = {};

  for (const line of lines) {
    const item = catalogIndex.itemsById.get(line.itemId);
    if (!item || item.status === 'stock_out') {
      const name = item?.item ?? 'Item';
      conflicts[line.key] = `${name} is no longer available. Choose another option or remove it.`;
      continue;
    }

    if (line.variantId) {
      const variant =
        catalogIndex.variantsById?.get(line.variantId) ??
        catalogIndex.variantsByItemId
          .get(item.id)
          ?.find((v) => v.id === line.variantId);
      if (!variant || variant.status === 'stock_out') {
        const variantLabel = variant?.label ? ` (${variant.label})` : '';
        conflicts[line.key] = `${item.item}${variantLabel} is no longer available. Choose another option or remove it.`;
        continue;
      }
    }

    for (const addOnEntry of line.addOns) {
      const addOn = catalogIndex.addOnsById.get(addOnEntry.addOnId);
      if (!addOn || addOn.status === 'stock_out') {
        const addOnName = addOn?.name ?? 'Add-on';
        conflicts[line.key] = `${addOnName} for ${item.item} is no longer available. Remove it to continue.`;
        break;
      }
    }
  }

  return conflicts;
}

export function parseCrossTabCartStorage(
  newValue: string | null,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): { kind: 'clear' } | { kind: 'hydrate'; lines: CartLine[] } | { kind: 'noop' } {
  if (newValue === null || newValue.trim() === '') {
    return { kind: 'clear' };
  }
  try {
    const parsed = JSON.parse(newValue) as Partial<PersistedCartPayload>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.version === CART_STORAGE_VERSION &&
      Array.isArray(parsed.lines)
    ) {
      if (parsed.lines.length === 0) {
        return { kind: 'clear' };
      }
      const validation = validateCartLinesAgainstCatalog(
        parsed.lines,
        catalogIndex
      );
      return { kind: 'hydrate', lines: validation.validLines };
    }
  } catch {
    // Ignore malformed cross-tab payload
  }
  return { kind: 'noop' };
}

export const CartStateContext = createContext<CartState | null>(null);
export const CatalogFilterContext = createContext<CatalogFilterState | null>(
  null
);
export const AlertsContext = createContext<AlertsState | null>(null);
export const DispatchContext = createContext<React.Dispatch<AppAction> | null>(
  null
);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, initialState);
  const persistTimerRef = useRef<number | null>(null);
  const hasWarnedStorageRef = useRef<boolean>(false);

  // 1. Hydrate cart from localStorage "gees.cart.v1" after mount & validate against catalog
  useEffect(() => {
    let hydratedLines: CartLine[] = [];
    let droppedCount = 0;
    let storageUnavailable = false;

    try {
      const testKey = '__gees_storage_probe__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);

      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<PersistedCartPayload>;
          // Ignore on version mismatch or invalid structure
          if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.version === CART_STORAGE_VERSION &&
            Array.isArray(parsed.lines)
          ) {
            const validation = validateCartLinesAgainstCatalog(
              parsed.lines,
              getCatalogIndex()
            );
            hydratedLines = validation.validLines;
            droppedCount = validation.droppedCount;
          }
        } catch {
          // Malformed JSON in storage — reset cleanly without treating storage as unavailable
        }
      }
    } catch {
      storageUnavailable = true;
    }

    dispatch(actions.cart.hydrate(hydratedLines));

    if (storageUnavailable && !hasWarnedStorageRef.current) {
      hasWarnedStorageRef.current = true;
      dispatch(actions.alerts.push(alertEvents.storageUnavailable()));
    }

    if (hydratedLines.length > 0) {
      dispatch(actions.alerts.push(alertEvents.cartRestored()));
    }

    if (droppedCount > 0) {
      dispatch(actions.alerts.push(alertEvents.itemsDroppedOnHydrate()));
    }
  }, []);

  // 1b. Cross-tab storage listener: sync when cart is cleared or updated in another tab
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
      const outcome = parseCrossTabCartStorage(
        event.newValue,
        getCatalogIndex()
      );
      if (outcome.kind === 'clear') {
        dispatch(actions.cart.clear());
      } else if (outcome.kind === 'hydrate') {
        dispatch(actions.cart.hydrate(outcome.lines));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 2. Persist cart changes to localStorage "gees.cart.v1" (debounced 300 ms)
  useEffect(() => {
    if (!state.cart.isHydrated) return;

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      try {
        const payload: PersistedCartPayload = {
          version: CART_STORAGE_VERSION,
          lines: state.cart.lines,
        };
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Private mode or storage quota exceeded: fall back to in-memory with a one-time warning
        if (!hasWarnedStorageRef.current) {
          hasWarnedStorageRef.current = true;
          dispatch(actions.alerts.push(alertEvents.storageUnavailable()));
        }
      }
    }, 300);

    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [state.cart.lines, state.cart.isHydrated]);

  // 3. Auto-dismiss alert timers (4 s standard, 6 s errors, sticky never)
  useEffect(() => {
    if (state.alerts.queue.length === 0) return;

    const now = Date.now();
    const timers: number[] = [];

    for (const alert of state.alerts.queue) {
      if (alert.sticky) continue;
      const durationMs = alert.severity === 'error' ? 6000 : 4000;
      const elapsed = Math.max(0, now - alert.createdAt);
      const remaining = Math.max(50, durationMs - elapsed);

      const timerId = window.setTimeout(() => {
        dispatch(actions.alerts.dismiss(alert.id));
      }, remaining);

      timers.push(timerId);
    }

    return () => {
      for (const timerId of timers) {
        window.clearTimeout(timerId);
      }
    };
  }, [state.alerts.queue]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state.cart}>
        <CatalogFilterContext.Provider value={state.catalogFilter}>
          <AlertsContext.Provider value={state.alerts}>
            {children}
          </AlertsContext.Provider>
        </CatalogFilterContext.Provider>
      </CartStateContext.Provider>
    </DispatchContext.Provider>
  );
}

export { AppStateProvider as CartProvider };

export function useCart(): CartState {
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error('useCart must be used within an AppStateProvider');
  }
  return ctx;
}

export function useCatalogFilter(): CatalogFilterState {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) {
    throw new Error('useCatalogFilter must be used within an AppStateProvider');
  }
  return ctx;
}

export function useAlerts(): AlertsState {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error('useAlerts must be used within an AppStateProvider');
  }
  return ctx;
}

export function useDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) {
    throw new Error('useDispatch must be used within an AppStateProvider');
  }
  return ctx;
}
