import { ActionTypes, type CartAction } from '@/state/actions';
import { initialCartState } from '@/state/initialState';
import type { CartAddOn, CartLine, CartState } from '@/state/types';

export const MIN_CART_QTY = 1;
export const MAX_CART_QTY = 50;

export function buildCartLineKey(
  itemId: string,
  variantId: string | null | undefined
): string {
  return `${itemId}:${variantId ?? '-'}`;
}

export function clampCartQty(value: number): number {
  const intVal = Number.isFinite(value) ? Math.trunc(value) : MIN_CART_QTY;
  if (intVal < MIN_CART_QTY) return MIN_CART_QTY;
  if (intVal > MAX_CART_QTY) return MAX_CART_QTY;
  return intVal;
}

export function mergeLineAddOns(
  existing: ReadonlyArray<CartAddOn>,
  incoming: ReadonlyArray<CartAddOn>
): CartAddOn[] {
  const map = new Map<string, number>();

  for (const entry of existing) {
    const truncated = Math.trunc(entry.qty);
    if (truncated <= 0) continue;
    const prev = map.get(entry.addOnId) ?? 0;
    map.set(entry.addOnId, clampCartQty(prev + truncated));
  }

  for (const entry of incoming) {
    const truncated = Math.trunc(entry.qty);
    const clampedIncoming = clampCartQty(truncated);
    const prev = map.get(entry.addOnId);
    if (prev !== undefined) {
      map.set(entry.addOnId, clampCartQty(prev + clampedIncoming));
    } else {
      map.set(entry.addOnId, clampedIncoming);
    }
  }

  const result: CartAddOn[] = [];
  for (const [addOnId, qty] of map.entries()) {
    result.push({ addOnId, qty });
  }
  return result;
}

function omitConflict(
  conflicts: Record<string, string>,
  keyToRemove: string
): Record<string, string> {
  if (!(keyToRemove in conflicts)) return conflicts;
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(conflicts)) {
    if (k !== keyToRemove) {
      next[k] = v;
    }
  }
  return next;
}

function assertNever(action: never): never {
  throw new Error(
    `Unhandled cart action: ${JSON.stringify(action)}`
  );
}

/**
 * Pure Cart Slice Reducer.
 */
export function cartSliceReducer(
  state: CartState = initialCartState,
  action: CartAction
): CartState {
  switch (action.type) {
    case ActionTypes.CART_ADD_LINE: {
      const { itemId, variantId, qty, addOns } = action.payload;
      const key = buildCartLineKey(itemId, variantId);
      const clampedQty = clampCartQty(qty);
      const normalizedAddOns = mergeLineAddOns([], addOns);

      const existingIdx = state.lines.findIndex((line) => line.key === key);
      if (existingIdx !== -1) {
        const nextLines = state.lines.map((line, idx) => {
          if (idx !== existingIdx) return line;
          return {
            ...line,
            qty: clampCartQty(line.qty + clampedQty),
            addOns: mergeLineAddOns(line.addOns, normalizedAddOns),
          };
        });
        return {
          ...state,
          lines: nextLines,
        };
      }

      const newLine: CartLine = {
        key,
        itemId,
        variantId,
        qty: clampedQty,
        addOns: normalizedAddOns,
      };

      return {
        ...state,
        lines: [...state.lines, newLine],
      };
    }

    case ActionTypes.CART_SET_QTY: {
      const { key, qty } = action.payload;
      const intQty = Number.isFinite(qty) ? Math.trunc(qty) : 0;

      if (intQty <= 0) {
        return {
          ...state,
          lines: state.lines.filter((line) => line.key !== key),
          conflicts: omitConflict(state.conflicts, key),
        };
      }

      const clamped = clampCartQty(intQty);
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.key === key ? { ...line, qty: clamped } : line
        ),
      };
    }

    case ActionTypes.CART_SET_VARIANT: {
      const { key, variantId } = action.payload;
      const sourceIndex = state.lines.findIndex((line) => line.key === key);
      if (sourceIndex === -1) return state;

      const sourceLine = state.lines[sourceIndex];
      const nextKey = buildCartLineKey(sourceLine.itemId, variantId);
      if (nextKey === key) return state;

      const targetIndex = state.lines.findIndex((line) => line.key === nextKey);
      const nextConflicts = omitConflict(state.conflicts, key);

      if (targetIndex !== -1) {
        const nextLines: CartLine[] = [];
        for (let i = 0; i < state.lines.length; i += 1) {
          if (i === sourceIndex) continue;
          const current = state.lines[i];
          if (i === targetIndex) {
            nextLines.push({
              ...current,
              qty: clampCartQty(current.qty + sourceLine.qty),
              addOns: mergeLineAddOns(current.addOns, sourceLine.addOns),
            });
          } else {
            nextLines.push(current);
          }
        }
        return {
          ...state,
          lines: nextLines,
          conflicts: nextConflicts,
        };
      }

      return {
        ...state,
        lines: state.lines.map((line, idx) =>
          idx === sourceIndex
            ? {
                ...line,
                key: nextKey,
                variantId,
              }
            : line
        ),
        conflicts: nextConflicts,
      };
    }

    case ActionTypes.CART_SET_ADDON_QTY: {
      const { key, addOnId, qty } = action.payload;
      const intQty = Number.isFinite(qty) ? Math.trunc(qty) : 0;

      return {
        ...state,
        lines: state.lines.map((line) => {
          if (line.key !== key) return line;
          if (intQty <= 0) {
            return {
              ...line,
              addOns: line.addOns.filter((a) => a.addOnId !== addOnId),
            };
          }
          const clamped = clampCartQty(intQty);
          const exists = line.addOns.some((a) => a.addOnId === addOnId);
          const nextAddOns = exists
            ? line.addOns.map((a) =>
                a.addOnId === addOnId ? { ...a, qty: clamped } : a
              )
            : [...line.addOns, { addOnId, qty: clamped }];
          return {
            ...line,
            addOns: nextAddOns,
          };
        }),
      };
    }

    case ActionTypes.CART_REMOVE_ADDON: {
      const { key, addOnId } = action.payload;
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.key === key
            ? {
                ...line,
                addOns: line.addOns.filter((a) => a.addOnId !== addOnId),
              }
            : line
        ),
      };
    }

    case ActionTypes.CART_REMOVE_LINE: {
      const { key } = action.payload;
      return {
        ...state,
        lines: state.lines.filter((line) => line.key !== key),
        conflicts: omitConflict(state.conflicts, key),
      };
    }

    case ActionTypes.CART_CLEAR: {
      return {
        ...state,
        lines: [],
        conflicts: {},
      };
    }

    case ActionTypes.CART_HYDRATE: {
      const mergedMap = new Map<string, CartLine>();
      for (const rawLine of action.payload.lines) {
        const key = buildCartLineKey(rawLine.itemId, rawLine.variantId);
        const clampedQty = clampCartQty(rawLine.qty);
        const normalizedAddOns = mergeLineAddOns([], rawLine.addOns ?? []);
        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, {
            ...existing,
            qty: clampCartQty(existing.qty + clampedQty),
            addOns: mergeLineAddOns(existing.addOns, normalizedAddOns),
          });
        } else {
          mergedMap.set(key, {
            key,
            itemId: rawLine.itemId,
            variantId: rawLine.variantId ?? null,
            qty: clampedQty,
            addOns: normalizedAddOns,
          });
        }
      }

      const nextLines = Array.from(mergedMap.values());
      const validKeys = new Set(nextLines.map((l) => l.key));
      const nextConflicts: Record<string, string> = {};
      for (const [k, v] of Object.entries(state.conflicts)) {
        if (validKeys.has(k)) {
          nextConflicts[k] = v;
        }
      }

      return {
        lines: nextLines,
        conflicts: nextConflicts,
        isHydrated: true,
      };
    }

    case ActionTypes.CART_SET_CONFLICTS: {
      return {
        ...state,
        conflicts: { ...action.payload.conflicts },
      };
    }

    default:
      return assertNever(action);
  }
}

export { cartSliceReducer as cartReducer };

