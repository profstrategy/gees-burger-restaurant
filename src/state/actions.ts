import type { Alert, CartAddOn, CartLine } from '@/state/types';

/** Namespaced action type constants */
export const ActionTypes = {
  CART_ADD_LINE: 'cart/addLine',
  CART_SET_QTY: 'cart/setQty',
  CART_SET_VARIANT: 'cart/setVariant',
  CART_SET_ADDON_QTY: 'cart/setAddOnQty',
  CART_REMOVE_ADDON: 'cart/removeAddOn',
  CART_REMOVE_LINE: 'cart/removeLine',
  CART_CLEAR: 'cart/clear',
  CART_HYDRATE: 'cart/hydrate',
  CART_SET_CONFLICTS: 'cart/setConflicts',

  SEARCH_SET_QUERY: 'search/setQuery',
  SEARCH_SET_MENU: 'search/setMenu',
  SEARCH_SET_SUBTYPE: 'search/setSubType',
  SEARCH_RESET: 'search/reset',

  ALERTS_PUSH: 'alerts/push',
  ALERTS_DISMISS: 'alerts/dismiss',
  ALERTS_CLEAR: 'alerts/clear',
} as const;

export interface AddLineInput {
  itemId: string;
  variantId?: string | null;
  qty?: number;
  addOns?: CartAddOn[];
}

export interface PushAlertInput {
  id?: string;
  severity: Alert['severity'];
  title?: string;
  message: string;
  dedupeKey?: string;
  sticky?: boolean;
  createdAt?: number;
  action?: Alert['action'];
}

export type CartAction =
  | {
      type: typeof ActionTypes.CART_ADD_LINE;
      payload: {
        itemId: string;
        variantId: string | null;
        qty: number;
        addOns: CartAddOn[];
      };
    }
  | {
      type: typeof ActionTypes.CART_SET_QTY;
      payload: {
        key: string;
        qty: number;
      };
    }
  | {
      type: typeof ActionTypes.CART_SET_VARIANT;
      payload: {
        key: string;
        variantId: string | null;
      };
    }
  | {
      type: typeof ActionTypes.CART_SET_ADDON_QTY;
      payload: {
        key: string;
        addOnId: string;
        qty: number;
      };
    }
  | {
      type: typeof ActionTypes.CART_REMOVE_ADDON;
      payload: {
        key: string;
        addOnId: string;
      };
    }
  | {
      type: typeof ActionTypes.CART_REMOVE_LINE;
      payload: {
        key: string;
      };
    }
  | {
      type: typeof ActionTypes.CART_CLEAR;
    }
  | {
      type: typeof ActionTypes.CART_HYDRATE;
      payload: {
        lines: CartLine[];
      };
    }
  | {
      type: typeof ActionTypes.CART_SET_CONFLICTS;
      payload: {
        conflicts: Record<string, string>;
      };
    };

export type CatalogFilterAction =
  | {
      type: typeof ActionTypes.SEARCH_SET_QUERY;
      payload: {
        query: string;
      };
    }
  | {
      type: typeof ActionTypes.SEARCH_SET_MENU;
      payload: {
        menuId: string | null;
      };
    }
  | {
      type: typeof ActionTypes.SEARCH_SET_SUBTYPE;
      payload: {
        subTypeId: string | null;
      };
    }
  | {
      type: typeof ActionTypes.SEARCH_RESET;
    };

export type AlertsAction =
  | {
      type: typeof ActionTypes.ALERTS_PUSH;
      payload: Alert;
    }
  | {
      type: typeof ActionTypes.ALERTS_DISMISS;
      payload: {
        id: string;
      };
    }
  | {
      type: typeof ActionTypes.ALERTS_CLEAR;
    };

export type AppAction = CartAction | CatalogFilterAction | AlertsAction;

function generateAlertId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `alert_${crypto.randomUUID()}`;
  }
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Typed action creators.
 * Ids and timestamps are created here in the action creators, never inside reducers.
 */
const cartActions = {
  addLine(input: AddLineInput): CartAction {
    return {
      type: ActionTypes.CART_ADD_LINE,
      payload: {
        itemId: input.itemId,
        variantId: input.variantId ?? null,
        qty: input.qty ?? 1,
        addOns: input.addOns ?? [],
      },
    };
  },
  setQty(
    keyOrPayload: string | { key: string; qty: number },
    qtyArg?: number
  ): CartAction {
    const payload =
      typeof keyOrPayload === 'string'
        ? { key: keyOrPayload, qty: qtyArg ?? 0 }
        : keyOrPayload;
    return {
      type: ActionTypes.CART_SET_QTY,
      payload,
    };
  },
  setVariant(
    keyOrPayload: string | { key: string; variantId: string | null },
    variantIdArg?: string | null
  ): CartAction {
    const payload =
      typeof keyOrPayload === 'string'
        ? { key: keyOrPayload, variantId: variantIdArg ?? null }
        : keyOrPayload;
    return {
      type: ActionTypes.CART_SET_VARIANT,
      payload,
    };
  },
  setAddOnQty(
    keyOrPayload: string | { key: string; addOnId: string; qty: number },
    addOnIdArg?: string,
    qtyArg?: number
  ): CartAction {
    const payload =
      typeof keyOrPayload === 'string'
        ? {
            key: keyOrPayload,
            addOnId: addOnIdArg ?? '',
            qty: qtyArg ?? 0,
          }
        : keyOrPayload;
    return {
      type: ActionTypes.CART_SET_ADDON_QTY,
      payload,
    };
  },
  removeAddOn(
    keyOrPayload: string | { key: string; addOnId: string },
    addOnIdArg?: string
  ): CartAction {
    const payload =
      typeof keyOrPayload === 'string'
        ? { key: keyOrPayload, addOnId: addOnIdArg ?? '' }
        : keyOrPayload;
    return {
      type: ActionTypes.CART_REMOVE_ADDON,
      payload,
    };
  },
  removeLine(keyOrPayload: string | { key: string }): CartAction {
    const payload =
      typeof keyOrPayload === 'string' ? { key: keyOrPayload } : keyOrPayload;
    return {
      type: ActionTypes.CART_REMOVE_LINE,
      payload,
    };
  },
  clear(): CartAction {
    return {
      type: ActionTypes.CART_CLEAR,
    };
  },
  hydrate(linesOrPayload: CartLine[] | { lines: CartLine[] }): CartAction {
    const lines = Array.isArray(linesOrPayload)
      ? linesOrPayload
      : linesOrPayload.lines;
    return {
      type: ActionTypes.CART_HYDRATE,
      payload: { lines },
    };
  },
  setConflicts(
    conflictsOrPayload:
      | Record<string, string>
      | { conflicts: Record<string, string> }
  ): CartAction {
    const conflicts =
      'conflicts' in conflictsOrPayload &&
      typeof conflictsOrPayload.conflicts === 'object'
        ? (conflictsOrPayload as { conflicts: Record<string, string> }).conflicts
        : (conflictsOrPayload as Record<string, string>);
    return {
      type: ActionTypes.CART_SET_CONFLICTS,
      payload: { conflicts },
    };
  },
} as const;

const searchActions = {
  setQuery(queryOrPayload: string | { query: string }): CatalogFilterAction {
    const query =
      typeof queryOrPayload === 'string'
        ? queryOrPayload
        : queryOrPayload.query;
    return {
      type: ActionTypes.SEARCH_SET_QUERY,
      payload: { query },
    };
  },
  setMenu(
    menuIdOrPayload: string | null | { menuId: string | null }
  ): CatalogFilterAction {
    const menuId =
      menuIdOrPayload !== null && typeof menuIdOrPayload === 'object'
        ? menuIdOrPayload.menuId
        : menuIdOrPayload;
    return {
      type: ActionTypes.SEARCH_SET_MENU,
      payload: { menuId },
    };
  },
  setSubType(
    subTypeIdOrPayload: string | null | { subTypeId: string | null }
  ): CatalogFilterAction {
    const subTypeId =
      subTypeIdOrPayload !== null && typeof subTypeIdOrPayload === 'object'
        ? subTypeIdOrPayload.subTypeId
        : subTypeIdOrPayload;
    return {
      type: ActionTypes.SEARCH_SET_SUBTYPE,
      payload: { subTypeId },
    };
  },
  reset(): CatalogFilterAction {
    return {
      type: ActionTypes.SEARCH_RESET,
    };
  },
} as const;

const alertsActions = {
  push(input: PushAlertInput): AlertsAction {
    return {
      type: ActionTypes.ALERTS_PUSH,
      payload: {
        id: input.id ?? generateAlertId(),
        severity: input.severity,
        title: input.title,
        message: input.message,
        dedupeKey: input.dedupeKey,
        sticky: input.sticky,
        createdAt: input.createdAt ?? Date.now(),
        action: input.action,
      },
    };
  },
  dismiss(idOrPayload: string | { id: string }): AlertsAction {
    const id =
      typeof idOrPayload === 'string' ? idOrPayload : idOrPayload.id;
    return {
      type: ActionTypes.ALERTS_DISMISS,
      payload: { id },
    };
  },
  clear(): AlertsAction {
    return {
      type: ActionTypes.ALERTS_CLEAR,
    };
  },
} as const;

export const actions = {
  cart: cartActions,
  search: searchActions,
  alerts: alertsActions,

  // Flat aliases
  cartAddLine: cartActions.addLine,
  cartSetQty: cartActions.setQty,
  cartSetVariant: cartActions.setVariant,
  cartSetAddOnQty: cartActions.setAddOnQty,
  cartRemoveAddOn: cartActions.removeAddOn,
  cartRemoveLine: cartActions.removeLine,
  cartClear: cartActions.clear,
  cartHydrate: cartActions.hydrate,
  cartSetConflicts: cartActions.setConflicts,

  searchSetQuery: searchActions.setQuery,
  searchSetMenu: searchActions.setMenu,
  searchSetSubType: searchActions.setSubType,
  searchReset: searchActions.reset,

  alertsPush: alertsActions.push,
  alertsDismiss: alertsActions.dismiss,
  alertsClear: alertsActions.clear,
} as const;

export const addLine = actions.cart.addLine;
export const setQty = actions.cart.setQty;
export const setVariant = actions.cart.setVariant;
export const setAddOnQty = actions.cart.setAddOnQty;
export const removeAddOn = actions.cart.removeAddOn;
export const removeLine = actions.cart.removeLine;
export const clearCart = actions.cart.clear;
export const hydrateCart = actions.cart.hydrate;
export const setConflicts = actions.cart.setConflicts;

export const setQuery = actions.search.setQuery;
export const setMenu = actions.search.setMenu;
export const setSubType = actions.search.setSubType;
export const resetSearch = actions.search.reset;

export const pushAlert = actions.alerts.push;
export const dismissAlert = actions.alerts.dismiss;
export const clearAlerts = actions.alerts.clear;
