import type { EntityId, ISODateString } from '@/types/catalog';

/**
 * Cart line stores ONLY ids and quantity — NEVER prices.
 * Prices are always resolved dynamically from the catalog.
 */
export interface CartLine {
  lineId: string;
  itemId: EntityId;
  variantId: EntityId | null;
  addOnIds: EntityId[];
  quantity: number;
  addedAt: ISODateString;
}

export interface CartState {
  lines: CartLine[];
  updatedAt: ISODateString | null;
}

export const initialCartState: CartState = {
  lines: [],
  updatedAt: null,
};

export type CartAction =
  | {
      type: 'HYDRATE_CART';
      payload: {
        lines: CartLine[];
        updatedAt: ISODateString;
      };
    }
  | {
      type: 'ADD_LINE';
      payload: {
        lineId: string;
        itemId: EntityId;
        variantId: EntityId | null;
        addOnIds: EntityId[];
        quantity: number;
        timestamp: ISODateString;
      };
    }
  | {
      type: 'SET_LINE_QUANTITY';
      payload: {
        lineId: string;
        quantity: number;
        timestamp: ISODateString;
      };
    }
  | {
      type: 'REMOVE_LINE';
      payload: {
        lineId: string;
        timestamp: ISODateString;
      };
    }
  | {
      type: 'TOGGLE_LINE_ADDON';
      payload: {
        lineId: string;
        addOnId: EntityId;
        timestamp: ISODateString;
      };
    }
  | {
      type: 'CLEAR_CART';
      payload: {
        timestamp: ISODateString;
      };
    };

function normalizeAddOnIds(addOnIds: ReadonlyArray<EntityId>): EntityId[] {
  return Array.from(new Set(addOnIds)).sort();
}

function sameConfiguration(
  a: Pick<CartLine, 'itemId' | 'variantId' | 'addOnIds'>,
  b: Pick<CartLine, 'itemId' | 'variantId' | 'addOnIds'>
): boolean {
  if (a.itemId !== b.itemId) return false;
  if ((a.variantId ?? null) !== (b.variantId ?? null)) return false;
  const normA = normalizeAddOnIds(a.addOnIds);
  const normB = normalizeAddOnIds(b.addOnIds);
  if (normA.length !== normB.length) return false;
  for (let i = 0; i < normA.length; i += 1) {
    if (normA[i] !== normB[i]) return false;
  }
  return true;
}

/**
 * Pure reducer: no Date.now, Math.random, crypto, localStorage, fetch, or timers.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE_CART': {
      return {
        lines: action.payload.lines.map((line) => ({
          lineId: line.lineId,
          itemId: line.itemId,
          variantId: line.variantId ?? null,
          addOnIds: normalizeAddOnIds(line.addOnIds ?? []),
          quantity: Math.max(1, Math.trunc(line.quantity)),
          addedAt: line.addedAt,
        })),
        updatedAt: action.payload.updatedAt,
      };
    }

    case 'ADD_LINE': {
      const { lineId, itemId, variantId, addOnIds, quantity, timestamp } =
        action.payload;
      const safeQty = Math.max(1, Math.trunc(quantity));
      const normalizedAddOns = normalizeAddOnIds(addOnIds);

      const existingIndex = state.lines.findIndex((line) =>
        sameConfiguration(line, {
          itemId,
          variantId,
          addOnIds: normalizedAddOns,
        })
      );

      if (existingIndex !== -1) {
        const nextLines = state.lines.map((line, idx) =>
          idx === existingIndex
            ? { ...line, quantity: line.quantity + safeQty }
            : line
        );
        return {
          lines: nextLines,
          updatedAt: timestamp,
        };
      }

      const newLine: CartLine = {
        lineId,
        itemId,
        variantId: variantId ?? null,
        addOnIds: normalizedAddOns,
        quantity: safeQty,
        addedAt: timestamp,
      };

      return {
        lines: [...state.lines, newLine],
        updatedAt: timestamp,
      };
    }

    case 'SET_LINE_QUANTITY': {
      const { lineId, quantity, timestamp } = action.payload;
      const safeQty = Math.trunc(quantity);
      if (safeQty <= 0) {
        return {
          lines: state.lines.filter((line) => line.lineId !== lineId),
          updatedAt: timestamp,
        };
      }
      return {
        lines: state.lines.map((line) =>
          line.lineId === lineId ? { ...line, quantity: safeQty } : line
        ),
        updatedAt: timestamp,
      };
    }

    case 'REMOVE_LINE': {
      return {
        lines: state.lines.filter(
          (line) => line.lineId !== action.payload.lineId
        ),
        updatedAt: action.payload.timestamp,
      };
    }

    case 'TOGGLE_LINE_ADDON': {
      const { lineId, addOnId, timestamp } = action.payload;
      return {
        lines: state.lines.map((line) => {
          if (line.lineId !== lineId) return line;
          const exists = line.addOnIds.includes(addOnId);
          const nextAddOns = exists
            ? line.addOnIds.filter((id) => id !== addOnId)
            : normalizeAddOnIds([...line.addOnIds, addOnId]);
          return { ...line, addOnIds: nextAddOns };
        }),
        updatedAt: timestamp,
      };
    }

    case 'CLEAR_CART': {
      return {
        lines: [],
        updatedAt: action.payload.timestamp,
      };
    }

    default:
      return state;
  }
}

/**
 * Action creators generate ids and timestamps outside the pure reducer.
 */
function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const cartActions = {
  hydrate(lines: CartLine[]): CartAction {
    return {
      type: 'HYDRATE_CART',
      payload: {
        lines,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  addLine(input: {
    itemId: EntityId;
    variantId?: EntityId | null;
    addOnIds?: EntityId[];
    quantity?: number;
  }): CartAction {
    return {
      type: 'ADD_LINE',
      payload: {
        lineId: createId('line'),
        itemId: input.itemId,
        variantId: input.variantId ?? null,
        addOnIds: input.addOnIds ?? [],
        quantity: input.quantity ?? 1,
        timestamp: new Date().toISOString(),
      },
    };
  },

  setQuantity(lineId: string, quantity: number): CartAction {
    return {
      type: 'SET_LINE_QUANTITY',
      payload: {
        lineId,
        quantity,
        timestamp: new Date().toISOString(),
      },
    };
  },

  removeLine(lineId: string): CartAction {
    return {
      type: 'REMOVE_LINE',
      payload: {
        lineId,
        timestamp: new Date().toISOString(),
      },
    };
  },

  toggleLineAddOn(lineId: string, addOnId: EntityId): CartAction {
    return {
      type: 'TOGGLE_LINE_ADDON',
      payload: {
        lineId,
        addOnId,
        timestamp: new Date().toISOString(),
      },
    };
  },

  clearCart(): CartAction {
    return {
      type: 'CLEAR_CART',
      payload: {
        timestamp: new Date().toISOString(),
      },
    };
  },
};
