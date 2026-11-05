import { z } from 'zod';
import type {
  AddOn,
  EntityId,
  GeesCatalog,
  ItemVariant,
  Menu,
  MenuItem,
  MenuSubType,
} from '@/types/catalog';

const digitStringSchema = z
  .string()
  .regex(/^\d+$/, 'Money value must be a digit string (e.g. "9000")');

const stockStatusSchema = z.enum(['in_stock', 'stock_out']);

export const menuSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  itemId: z.array(z.string().min(1)),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const menuSubTypeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  menuId: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const menuItemSchema = z.object({
  id: z.string().min(1),
  item: z.string().min(1),
  price: digitStringSchema.nullable(),
  composition: z.string().nullable(),
  imageUrl: z.string().nullable(),
  status: stockStatusSchema,
  menuId: z.string().min(1),
  subTypeId: z.string().nullable(),
  isSpicy: z.boolean(),
  addOnId: z.array(z.string().min(1)),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const itemVariantSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  label: z.string().min(1),
  price: digitStringSchema,
  status: stockStatusSchema,
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const addOnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: digitStringSchema,
  status: stockStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const rawCatalogEnvelopeSchema = z.object({
  menus: z.array(z.unknown()),
  menuSubTypes: z.array(z.unknown()),
  menuItems: z.array(z.unknown()),
  itemVariants: z.array(z.unknown()),
  addOns: z.array(z.unknown()),
});

export interface CatalogValidationResult {
  catalog: GeesCatalog;
  menusById: Map<EntityId, Menu>;
  itemsById: Map<EntityId, MenuItem>;
  subTypesByMenuId: Map<EntityId, MenuSubType[]>;
  subTypesById: Map<EntityId, MenuSubType>;
  variantsByItemId: Map<EntityId, ItemVariant[]>;
  variantsById: Map<EntityId, ItemVariant>;
  addOnsById: Map<EntityId, AddOn>;
  warnings: string[];
}

function warnAndRecord(warnings: string[], message: string): void {
  warnings.push(message);
  console.warn(`[GeesCatalog Validator] ${message}`);
}

/**
 * Validates raw catalog data with Zod:
 * - No duplicate IDs across menus, subTypes, addOns, variants, or items
 * - All foreign key IDs resolve (menuId, subTypeId, addOnId, menu.itemId)
 * - Strictly enforces `price XOR variants` on every MenuItem
 * - On any violation, logs `console.warn` and skips the offending record.
 */
export function validateAndIndexCatalog(raw: unknown): CatalogValidationResult {
  const warnings: string[] = [];

  const menusById = new Map<EntityId, Menu>();
  const subTypesById = new Map<EntityId, MenuSubType>();
  const subTypesByMenuId = new Map<EntityId, MenuSubType[]>();
  const addOnsById = new Map<EntityId, AddOn>();
  const variantsById = new Map<EntityId, ItemVariant>();
  const variantsByItemId = new Map<EntityId, ItemVariant[]>();
  const itemsById = new Map<EntityId, MenuItem>();

  const envelope = rawCatalogEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    warnAndRecord(
      warnings,
      `Invalid catalog envelope: ${envelope.error.message}`
    );
    return {
      catalog: {
        menus: [],
        menuSubTypes: [],
        menuItems: [],
        itemVariants: [],
        addOns: [],
      },
      menusById,
      itemsById,
      subTypesByMenuId,
      subTypesById,
      variantsByItemId,
      variantsById,
      addOnsById,
      warnings,
    };
  }

  // 1. Validate Menus (no duplicate menu ids)
  const rawMenus: Menu[] = [];
  for (const rawMenu of envelope.data.menus) {
    const parsed = menuSchema.safeParse(rawMenu);
    if (!parsed.success) {
      warnAndRecord(
        warnings,
        `Skipping invalid menu: ${parsed.error.issues[0]?.message ?? 'schema error'}`
      );
      continue;
    }
    if (menusById.has(parsed.data.id)) {
      warnAndRecord(warnings, `Skipping duplicate menu id "${parsed.data.id}"`);
      continue;
    }
    menusById.set(parsed.data.id, parsed.data);
    rawMenus.push(parsed.data);
  }

  // 2. Validate MenuSubTypes (no duplicate ids, menuId must resolve)
  const validSubTypes: MenuSubType[] = [];
  for (const rawSub of envelope.data.menuSubTypes) {
    const parsed = menuSubTypeSchema.safeParse(rawSub);
    if (!parsed.success) {
      warnAndRecord(
        warnings,
        `Skipping invalid menuSubType: ${parsed.error.issues[0]?.message ?? 'schema error'}`
      );
      continue;
    }
    if (subTypesById.has(parsed.data.id)) {
      warnAndRecord(
        warnings,
        `Skipping duplicate menuSubType id "${parsed.data.id}"`
      );
      continue;
    }
    if (!menusById.has(parsed.data.menuId)) {
      warnAndRecord(
        warnings,
        `Skipping menuSubType "${parsed.data.id}" with unresolved menuId "${parsed.data.menuId}"`
      );
      continue;
    }
    subTypesById.set(parsed.data.id, parsed.data);
    const list = subTypesByMenuId.get(parsed.data.menuId) ?? [];
    list.push(parsed.data);
    subTypesByMenuId.set(parsed.data.menuId, list);
    validSubTypes.push(parsed.data);
  }

  // 3. Validate AddOns (no duplicate ids)
  const validAddOns: AddOn[] = [];
  for (const rawAddOn of envelope.data.addOns) {
    const parsed = addOnSchema.safeParse(rawAddOn);
    if (!parsed.success) {
      warnAndRecord(
        warnings,
        `Skipping invalid addOn: ${parsed.error.issues[0]?.message ?? 'schema error'}`
      );
      continue;
    }
    if (addOnsById.has(parsed.data.id)) {
      warnAndRecord(
        warnings,
        `Skipping duplicate addOn id "${parsed.data.id}"`
      );
      continue;
    }
    addOnsById.set(parsed.data.id, parsed.data);
    validAddOns.push(parsed.data);
  }

  // 4. Validate ItemVariants (no duplicate variant ids; group by itemId and sort by sortOrder)
  const preliminaryVariantsByItemId = new Map<EntityId, ItemVariant[]>();
  for (const rawVariant of envelope.data.itemVariants) {
    const parsed = itemVariantSchema.safeParse(rawVariant);
    if (!parsed.success) {
      warnAndRecord(
        warnings,
        `Skipping invalid itemVariant: ${parsed.error.issues[0]?.message ?? 'schema error'}`
      );
      continue;
    }
    if (variantsById.has(parsed.data.id)) {
      warnAndRecord(
        warnings,
        `Skipping duplicate itemVariant id "${parsed.data.id}"`
      );
      continue;
    }
    variantsById.set(parsed.data.id, parsed.data);
    const list = preliminaryVariantsByItemId.get(parsed.data.itemId) ?? [];
    list.push(parsed.data);
    preliminaryVariantsByItemId.set(parsed.data.itemId, list);
  }

  // Sort variants by sortOrder ascending
  for (const [itemId, list] of preliminaryVariantsByItemId.entries()) {
    preliminaryVariantsByItemId.set(
      itemId,
      [...list].sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  // 5. Validate MenuItems (no duplicates, foreign keys resolve, price XOR variants)
  const validItems: MenuItem[] = [];
  for (const rawItem of envelope.data.menuItems) {
    const parsed = menuItemSchema.safeParse(rawItem);
    if (!parsed.success) {
      warnAndRecord(
        warnings,
        `Skipping invalid menuItem: ${parsed.error.issues[0]?.message ?? 'schema error'}`
      );
      continue;
    }
    const item = parsed.data;

    if (itemsById.has(item.id)) {
      warnAndRecord(warnings, `Skipping duplicate menuItem id "${item.id}"`);
      continue;
    }

    // menuId must resolve
    if (!menusById.has(item.menuId)) {
      warnAndRecord(
        warnings,
        `Skipping item "${item.id}": unresolved menuId "${item.menuId}"`
      );
      continue;
    }

    // subTypeId resolution
    const menuSubTypesForMenu = subTypesByMenuId.get(item.menuId) ?? [];
    if (item.subTypeId !== null) {
      const sub = subTypesById.get(item.subTypeId);
      if (!sub || sub.menuId !== item.menuId) {
        warnAndRecord(
          warnings,
          `Skipping item "${item.id}": subTypeId "${item.subTypeId}" does not resolve under menu "${item.menuId}"`
        );
        continue;
      }
    } else if (menuSubTypesForMenu.length > 0) {
      warnAndRecord(
        warnings,
        `Skipping item "${item.id}": menu "${item.menuId}" requires a valid subTypeId`
      );
      continue;
    }

    // addOnId resolution and duplicate check
    const seenAddOns = new Set<EntityId>();
    let addOnError = false;
    for (const addOnId of item.addOnId) {
      if (seenAddOns.has(addOnId)) {
        warnAndRecord(
          warnings,
          `Skipping item "${item.id}": duplicate addOnId "${addOnId}"`
        );
        addOnError = true;
        break;
      }
      if (!addOnsById.has(addOnId)) {
        warnAndRecord(
          warnings,
          `Skipping item "${item.id}": unresolved addOnId "${addOnId}"`
        );
        addOnError = true;
        break;
      }
      seenAddOns.add(addOnId);
    }
    if (addOnError) continue;

    // price XOR variants check
    const itemVariants = preliminaryVariantsByItemId.get(item.id) ?? [];
    const hasPrice = item.price !== null;
    const hasVariants = itemVariants.length > 0;
    if ((hasPrice && hasVariants) || (!hasPrice && !hasVariants)) {
      warnAndRecord(
        warnings,
        `Skipping item "${item.id}": violates price XOR variants (price=${String(
          item.price
        )}, variants=${itemVariants.length})`
      );
      continue;
    }

    itemsById.set(item.id, item);
    validItems.push(item);
    if (hasVariants) {
      variantsByItemId.set(item.id, itemVariants);
    }
  }

  // Keep only variants whose itemId resolved to a valid item
  const validVariants: ItemVariant[] = [];
  for (const [variantId, variant] of variantsById.entries()) {
    if (!itemsById.has(variant.itemId)) {
      warnAndRecord(
        warnings,
        `Skipping orphan variant "${variantId}" for missing/invalid item "${variant.itemId}"`
      );
      variantsById.delete(variantId);
      continue;
    }
    validVariants.push(variant);
  }

  // Filter menu.itemId so every referenced itemId exists and has no duplicates
  const validMenus: Menu[] = [];
  for (const menu of rawMenus) {
    const seenInMenu = new Set<EntityId>();
    const filteredItemIds: EntityId[] = [];
    for (const id of menu.itemId) {
      if (seenInMenu.has(id)) {
        warnAndRecord(
          warnings,
          `Menu "${menu.id}" contains duplicate itemId "${id}"; skipping duplicate reference`
        );
        continue;
      }
      const resolvedItem = itemsById.get(id);
      if (!resolvedItem) {
        warnAndRecord(
          warnings,
          `Menu "${menu.id}" references unresolved itemId "${id}"; skipping reference`
        );
        continue;
      }
      if (resolvedItem.menuId !== menu.id) {
        warnAndRecord(
          warnings,
          `Menu "${menu.id}" references item "${id}" belonging to "${resolvedItem.menuId}"; skipping reference`
        );
        continue;
      }
      seenInMenu.add(id);
      filteredItemIds.push(id);
    }
    const cleanMenu: Menu = {
      ...menu,
      itemId: filteredItemIds,
    };
    menusById.set(cleanMenu.id, cleanMenu);
    validMenus.push(cleanMenu);
  }

  return {
    catalog: {
      menus: validMenus,
      menuSubTypes: validSubTypes,
      menuItems: validItems,
      itemVariants: validVariants,
      addOns: validAddOns,
    },
    menusById,
    itemsById,
    subTypesByMenuId,
    subTypesById,
    variantsByItemId,
    variantsById,
    addOnsById,
    warnings,
  };
}
