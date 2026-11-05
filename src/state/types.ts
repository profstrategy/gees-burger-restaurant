import type {
  EntityId,
  Menu,
  MenuItem,
  MenuSubType,
} from '@/types/catalog';

export interface CartAddOn {
  addOnId: string;
  qty: number;
}

export interface CartLine {
  key: string;
  itemId: string;
  variantId: string | null;
  qty: number;
  addOns: { addOnId: string; qty: number }[];
}

/** No totals stored — all prices and totals are derived via selectors from the catalog. */
export interface CartState {
  lines: CartLine[];
  conflicts: Record<string, string>;
  isHydrated: boolean;
}

export interface CatalogFilterState {
  query: string;
  menuId: string | null;
  subTypeId: string | null;
}

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error';
export type AlertActionKind = 'retrySubmit' | 'reviewCart' | 'link';

export interface AlertAction {
  label: string;
  kind: AlertActionKind;
  href?: string;
}

/** Never store functions in state; actions are serializable descriptors. */
export interface Alert {
  id: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  dedupeKey?: string;
  sticky?: boolean;
  createdAt: number;
  action?: {
    label: string;
    kind: 'retrySubmit' | 'reviewCart' | 'link';
    href?: string;
  };
}

/** Max 3 alerts in the queue. */
export interface AlertsState {
  queue: Alert[];
}

export interface RootState {
  cart: CartState;
  catalogFilter: CatalogFilterState;
  alerts: AlertsState;
}

export interface VisibleSubTypeGroup {
  subType: MenuSubType;
  items: MenuItem[];
}

export interface VisibleMenuSection {
  menu: Menu;
  items: MenuItem[];
  subTypes: VisibleSubTypeGroup[];
  subTypeGroups: VisibleSubTypeGroup[] | null;
}

export type { EntityId };
