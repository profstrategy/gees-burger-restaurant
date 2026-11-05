import type {
  AlertsState,
  CartState,
  CatalogFilterState,
  RootState,
} from '@/state/types';

export const initialCartState: CartState = {
  lines: [],
  conflicts: {},
  isHydrated: false,
};

export const initialCatalogFilterState: CatalogFilterState = {
  query: '',
  menuId: null,
  subTypeId: null,
};

export const initialAlertsState: AlertsState = {
  queue: [],
};

export const initialState: RootState = {
  cart: initialCartState,
  catalogFilter: initialCatalogFilterState,
  alerts: initialAlertsState,
};
