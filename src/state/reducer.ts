import { ActionTypes, type AppAction } from '@/state/actions';
import { initialState } from '@/state/initialState';
import type { RootState } from '@/state/types';
import { cartSliceReducer } from '@/state/slices/cart.reducer';
import { catalogFilterSliceReducer } from '@/state/slices/catalog.reducer';
import { alertsSliceReducer } from '@/state/slices/alerts.reducer';

function assertNever(action: never): never {
  throw new Error(`Unhandled action in rootReducer: ${JSON.stringify(action)}`);
}

/**
 * Pure root reducer with exhaustive `never` check across all namespaced actions.
 */
export function rootReducer(
  state: RootState = initialState,
  action: AppAction
): RootState {
  switch (action.type) {
    case ActionTypes.CART_ADD_LINE:
    case ActionTypes.CART_SET_QTY:
    case ActionTypes.CART_SET_VARIANT:
    case ActionTypes.CART_SET_ADDON_QTY:
    case ActionTypes.CART_REMOVE_ADDON:
    case ActionTypes.CART_REMOVE_LINE:
    case ActionTypes.CART_CLEAR:
    case ActionTypes.CART_HYDRATE:
    case ActionTypes.CART_SET_CONFLICTS: {
      const nextCart = cartSliceReducer(state.cart, action);
      if (nextCart === state.cart) return state;
      return { ...state, cart: nextCart };
    }

    case ActionTypes.SEARCH_SET_QUERY:
    case ActionTypes.SEARCH_SET_MENU:
    case ActionTypes.SEARCH_SET_SUBTYPE:
    case ActionTypes.SEARCH_RESET: {
      const nextFilter = catalogFilterSliceReducer(state.catalogFilter, action);
      if (nextFilter === state.catalogFilter) return state;
      return { ...state, catalogFilter: nextFilter };
    }

    case ActionTypes.ALERTS_PUSH:
    case ActionTypes.ALERTS_DISMISS:
    case ActionTypes.ALERTS_CLEAR: {
      const nextAlerts = alertsSliceReducer(state.alerts, action);
      if (nextAlerts === state.alerts) return state;
      return { ...state, alerts: nextAlerts };
    }

    default:
      return assertNever(action);
  }
}
