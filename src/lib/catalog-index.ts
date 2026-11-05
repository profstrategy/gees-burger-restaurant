import rawCatalogJson from '@/data/catalog.json';
import type {
  AddOn,
  EntityId,
  GeesCatalog,
  ItemVariant,
  Menu,
  MenuItem,
  MenuSubType,
} from '@/types/catalog';
import {
  validateAndIndexCatalog,
  type CatalogValidationResult,
} from '@/schemas/catalog';

/**
 * Validated and indexed catalog singleton run at module load.
 * Exposes Maps:
 * - menusById
 * - itemsById
 * - subTypesByMenuId
 * - variantsByItemId (sorted by sortOrder)
 * - addOnsById
 */
const indexedCatalog: CatalogValidationResult =
  validateAndIndexCatalog(rawCatalogJson);

export const validatedCatalog: GeesCatalog = indexedCatalog.catalog;
export const menusById: Map<EntityId, Menu> = indexedCatalog.menusById;
export const itemsById: Map<EntityId, MenuItem> = indexedCatalog.itemsById;
export const subTypesByMenuId: Map<EntityId, MenuSubType[]> =
  indexedCatalog.subTypesByMenuId;
export const subTypesById: Map<EntityId, MenuSubType> =
  indexedCatalog.subTypesById;
export const variantsByItemId: Map<EntityId, ItemVariant[]> =
  indexedCatalog.variantsByItemId;
export const variantsById: Map<EntityId, ItemVariant> =
  indexedCatalog.variantsById;
export const addOnsById: Map<EntityId, AddOn> = indexedCatalog.addOnsById;
export const catalogWarnings: string[] = indexedCatalog.warnings;

export const catalogValidationSummary = {
  menusCount: validatedCatalog.menus.length,
  subTypesCount: validatedCatalog.menuSubTypes.length,
  itemsCount: validatedCatalog.menuItems.length,
  variantsCount: validatedCatalog.itemVariants.length,
  addOnsCount: validatedCatalog.addOns.length,
  warningsCount: catalogWarnings.length,
  warnings: catalogWarnings,
} as const;

export const catalogIndex: CatalogValidationResult = indexedCatalog;

export function getCatalogIndex(): CatalogValidationResult {
  return indexedCatalog;
}

