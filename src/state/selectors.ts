import type {
  AddOn,
  EntityId,
  GeesCatalog,
  ItemVariant,
  Menu,
  MenuItem,
  MenuSubType,
} from '@/types/catalog';
import { getCatalogIndex } from '@/lib/catalog-index';
import { multiply, sum, toInt } from '@/lib/money';
import { buildCartLineKey } from '@/state/slices/cart.reducer';
import type {
  CartLine,
  CartState,
  CatalogFilterState,
  RootState,
  VisibleMenuSection,
  VisibleSubTypeGroup,
} from '@/state/types';

export { buildCartLineKey as buildLineKey };

export interface CatalogIndexLike {
  catalog?: GeesCatalog;
  menusById: Map<EntityId, Menu>;
  itemsById: Map<EntityId, MenuItem>;
  subTypesByMenuId: Map<EntityId, MenuSubType[]>;
  subTypesById?: Map<EntityId, MenuSubType>;
  variantsByItemId: Map<EntityId, ItemVariant[]>;
  variantsById?: Map<EntityId, ItemVariant>;
  addOnsById: Map<EntityId, AddOn>;
}

function extractCartState(state: RootState | CartState): CartState {
  if ('cart' in state) {
    return state.cart;
  }
  return state;
}

function extractFilterState(
  state: RootState | CatalogFilterState
): CatalogFilterState {
  if ('catalogFilter' in state) {
    return state.catalogFilter;
  }
  return state;
}

function resolveVariant(
  idx: CatalogIndexLike,
  itemId: string,
  variantId: string | null
): ItemVariant | undefined {
  if (!variantId) return undefined;
  if (idx.variantsById) {
    return idx.variantsById.get(variantId);
  }
  const list = idx.variantsByItemId.get(itemId) ?? [];
  return list.find((v) => v.id === variantId);
}

/**
 * Computes the base unit price (in integer Naira) for a CartLine.
 */
export function selectLineUnitPrice(
  line: Pick<CartLine, 'itemId' | 'variantId'>,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): number {
  const item = catalogIndex.itemsById.get(line.itemId);
  if (!item) return 0;

  if (line.variantId) {
    const variant = resolveVariant(catalogIndex, line.itemId, line.variantId);
    if (!variant) return 0;
    return toInt(variant.price);
  }
  if (item.price !== null) {
    return toInt(item.price);
  }
  const variants = catalogIndex.variantsByItemId.get(line.itemId) ?? [];
  if (variants[0]) {
    return toInt(variants[0].price);
  }
  return 0;
}

/**
 * Computes the integer Naira total for a single CartLine.
 * Add-on quantities are independent of item quantity:
 * e.g. 3 × 2 pcs chicken (3 × 6,000 = 18,000) + 4 × Side of Rice (4 × 5,000 = 20,000) = 38,000.
 */
export function selectLineTotal(
  line: CartLine,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): number {
  const baseUnitPrice = selectLineUnitPrice(line, catalogIndex);
  const baseTotal = multiply(baseUnitPrice, line.qty);

  const addOnTotals = line.addOns.map((entry) => {
    const addOn = catalogIndex.addOnsById.get(entry.addOnId);
    if (!addOn) return 0;
    return multiply(addOn.price, entry.qty);
  });

  return sum([baseTotal, ...addOnTotals]);
}

/**
 * Computes the integer Naira subtotal across all lines in the cart.
 */
export function selectCartTotal(
  state: RootState | CartState,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): number {
  const cart = extractCartState(state);
  const lineTotals = cart.lines.map((line) =>
    selectLineTotal(line, catalogIndex)
  );
  return sum(lineTotals);
}

/**
 * Computes total item quantity across all lines in the cart.
 */
export function selectCartCount(state: RootState | CartState): number {
  const cart = extractCartState(state);
  return sum(cart.lines.map((line) => line.qty));
}

/**
 * Case- and diacritic-insensitive text normalization (e.g. "Jalapeño" -> "jalapeno").
 */
export function normalizeForSearch(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function itemMatchesQuery(
  item: MenuItem,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;
  const nameNorm = normalizeForSearch(item.item);
  if (nameNorm.includes(normalizedQuery)) return true;
  const compNorm = normalizeForSearch(item.composition);
  return compNorm.includes(normalizedQuery);
}

/**
 * Returns visible menus with their filtered items, omitting empty menus.
 * For a menu with sub-types (e.g. Drinks), returns items grouped by sub-type.
 * `subTypeId` is only valid while its menu is selected (`filter.menuId === menu.id`).
 */
export function selectVisibleMenus(
  stateOrFilter: RootState | CatalogFilterState,
  catalogIndex: CatalogIndexLike = getCatalogIndex()
): VisibleMenuSection[] {
  const filter = extractFilterState(stateOrFilter);
  const normalizedQuery = normalizeForSearch(filter.query);

  const allMenus = catalogIndex.catalog
    ? catalogIndex.catalog.menus
    : Array.from(catalogIndex.menusById.values());

  const candidateMenus = filter.menuId
    ? allMenus.filter((menu) => menu.id === filter.menuId)
    : allMenus;

  const sections: VisibleMenuSection[] = [];

  for (const menu of candidateMenus) {
    const menuSubTypes = catalogIndex.subTypesByMenuId.get(menu.id) ?? [];

    // subTypeId is only valid while its menu is selected
    const activeSubTypeId =
      filter.menuId === menu.id &&
      filter.subTypeId &&
      menuSubTypes.some((st) => st.id === filter.subTypeId)
        ? filter.subTypeId
        : null;

    const matchingItems: MenuItem[] = [];
    for (const itemId of menu.itemId) {
      const item = catalogIndex.itemsById.get(itemId);
      if (!item) continue;
      if (activeSubTypeId && item.subTypeId !== activeSubTypeId) continue;
      if (!itemMatchesQuery(item, normalizedQuery)) continue;
      matchingItems.push(item);
    }

    if (matchingItems.length === 0) continue;

    const subTypeGroups: VisibleSubTypeGroup[] = [];
    if (menuSubTypes.length > 0) {
      for (const subType of menuSubTypes) {
        if (activeSubTypeId && subType.id !== activeSubTypeId) continue;
        const groupItems = matchingItems.filter(
          (item) => item.subTypeId === subType.id
        );
        if (groupItems.length > 0) {
          subTypeGroups.push({
            subType,
            items: groupItems,
          });
        }
      }
    }

    sections.push({
      menu,
      items: matchingItems,
      subTypes: subTypeGroups,
      subTypeGroups: subTypeGroups.length > 0 ? subTypeGroups : null,
    });
  }

  return sections;
}
