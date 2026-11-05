import type {
  AddOn,
  EntityId,
  GeesCatalog,
  ItemVariant,
  Menu,
  MenuItem,
  MenuSubType,
} from '@/types/catalog';
import type {
  DeliveryArea,
  OrderLinePayload,
  OrderSubmissionPayload,
} from '@/lib/api/types';
import { formatNaira, multiply, sum, toInt } from '@/lib/money';

export interface CatalogLookup {
  menusById: Map<EntityId, Menu>;
  subTypesById: Map<EntityId, MenuSubType>;
  itemsById: Map<EntityId, MenuItem>;
  variantsById: Map<EntityId, ItemVariant>;
  variantsByItemId: Map<EntityId, ItemVariant[]>;
  addOnsById: Map<EntityId, AddOn>;
}

export function buildCatalogLookup(catalog: GeesCatalog): CatalogLookup {
  const menusById = new Map<EntityId, Menu>();
  for (const menu of catalog.menus) {
    menusById.set(menu.id, menu);
  }

  const subTypesById = new Map<EntityId, MenuSubType>();
  for (const sub of catalog.menuSubTypes) {
    subTypesById.set(sub.id, sub);
  }

  const itemsById = new Map<EntityId, MenuItem>();
  for (const item of catalog.menuItems) {
    itemsById.set(item.id, item);
  }

  const variantsById = new Map<EntityId, ItemVariant>();
  const variantsByItemId = new Map<EntityId, ItemVariant[]>();
  for (const variant of catalog.itemVariants) {
    variantsById.set(variant.id, variant);
    const list = variantsByItemId.get(variant.itemId) ?? [];
    list.push(variant);
    variantsByItemId.set(variant.itemId, list);
  }
  for (const [key, list] of variantsByItemId.entries()) {
    variantsByItemId.set(
      key,
      [...list].sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  const addOnsById = new Map<EntityId, AddOn>();
  for (const addOn of catalog.addOns) {
    addOnsById.set(addOn.id, addOn);
  }

  return {
    menusById,
    subTypesById,
    itemsById,
    variantsById,
    variantsByItemId,
    addOnsById,
  };
}

/**
 * Resolve the integer unit price of a line (base item or variant + selected add-ons)
 * strictly from the catalog using src/lib/money.ts.
 */
export function resolveLineUnitPrice(
  lookup: CatalogLookup,
  itemId: EntityId,
  variantId: EntityId | null,
  addOnIds: ReadonlyArray<EntityId>
): number {
  const item = lookup.itemsById.get(itemId);
  if (!item) return 0;

  let basePrice = 0;
  if (variantId) {
    const variant = lookup.variantsById.get(variantId);
    basePrice = variant ? toInt(variant.price) : 0;
  } else if (item.price !== null) {
    basePrice = toInt(item.price);
  } else {
    const variants = lookup.variantsByItemId.get(itemId) ?? [];
    if (variants[0]) {
      basePrice = toInt(variants[0].price);
    }
  }

  const addOnAmounts = addOnIds.map((id) => {
    const addOn = lookup.addOnsById.get(id);
    return addOn ? addOn.price : '0';
  });

  return sum([basePrice, ...addOnAmounts]);
}

export function resolveLineTotalPrice(
  lookup: CatalogLookup,
  line: Pick<OrderLinePayload, 'itemId' | 'variantId' | 'addOnIds' | 'quantity'>
): number {
  const unitPrice = resolveLineUnitPrice(
    lookup,
    line.itemId,
    line.variantId,
    line.addOnIds
  );
  return multiply(unitPrice, line.quantity);
}

export function resolveCartSubtotal(
  lookup: CatalogLookup,
  lines: ReadonlyArray<
    Pick<OrderLinePayload, 'itemId' | 'variantId' | 'addOnIds' | 'quantity'>
  >
): number {
  const lineTotals = lines.map((line) => resolveLineTotalPrice(lookup, line));
  return sum(lineTotals);
}

export function resolveDeliveryFee(
  areas: ReadonlyArray<DeliveryArea>,
  fulfillment: 'pickup' | 'delivery',
  deliveryAreaId: EntityId | null,
  transportMode: 'bike' | 'car' | null
): number {
  if (fulfillment !== 'delivery' || !deliveryAreaId) return 0;
  const area = areas.find((a) => a.id === deliveryAreaId);
  if (!area) return 0;
  const mode = transportMode ?? 'bike';
  return toInt(mode === 'car' ? area.carFee : area.bikeFee);
}

export function buildWhatsAppOrderMessage(
  catalog: GeesCatalog,
  areas: ReadonlyArray<DeliveryArea>,
  payload: OrderSubmissionPayload
): {
  messagePreview: string;
  whatsappUrl: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
} {
  const lookup = buildCatalogLookup(catalog);
  const subtotal = resolveCartSubtotal(lookup, payload.lines);
  const deliveryFee = resolveDeliveryFee(
    areas,
    payload.fulfillment,
    payload.deliveryAreaId,
    payload.transportMode
  );
  const total = sum([subtotal, deliveryFee]);

  const itemLines = payload.lines.map((line, index) => {
    const item = lookup.itemsById.get(line.itemId);
    const variant = line.variantId
      ? lookup.variantsById.get(line.variantId)
      : undefined;
    const addOns = line.addOnIds
      .map((id) => lookup.addOnsById.get(id))
      .filter((a): a is AddOn => Boolean(a));

    const titlePart = item ? item.item : line.itemId;
    const variantPart = variant ? ` (${variant.label})` : '';
    const addOnPart =
      addOns.length > 0
        ? ` + ${addOns.map((a) => a.name).join(', ')}`
        : '';
    const lineTotal = resolveLineTotalPrice(lookup, line);

    return `${index + 1}. ${line.quantity}x ${titlePart}${variantPart}${addOnPart} — ${formatNaira(lineTotal)}`;
  });

  const area = payload.deliveryAreaId
    ? areas.find((a) => a.id === payload.deliveryAreaId)
    : undefined;

  const fulfillmentLines =
    payload.fulfillment === 'delivery'
      ? [
          `Fulfillment: Delivery (${payload.transportMode === 'car' ? 'Car' : 'Bike'})`,
          `Area: ${area ? area.name : 'Selected Area'}`,
          `Address: ${payload.address || 'N/A'}`,
          payload.landmark ? `Landmark: ${payload.landmark}` : null,
        ].filter(Boolean)
      : [
          'Fulfillment: Pickup',
          'Pickup Address: No. 32 Bompai Road, opposite Grand Square, Kano',
        ];

  const blocks = [
    `*GEE'S BURGER ORDER — #${payload.orderId}*`,
    '',
    '*Items:*',
    ...itemLines,
    '',
    `Subtotal: ${formatNaira(subtotal)}`,
    payload.fulfillment === 'delivery'
      ? `Delivery Fee: ${formatNaira(deliveryFee)}`
      : 'Delivery Fee: ₦0 (Pickup)',
    `*Total: ${formatNaira(total)}*`,
    '',
    '*Customer Details:*',
    `Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    ...fulfillmentLines,
    payload.notes ? `Note: ${payload.notes}` : null,
  ].filter((line): line is string => line !== null);

  const messagePreview = blocks.join('\n');
  const rawNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2349166606000';
  const cleanNumber = rawNumber.replace(/[^\d]/g, '') || '2349166606000';
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    messagePreview
  )}`;

  return {
    messagePreview,
    whatsappUrl,
    subtotal,
    deliveryFee,
    total,
  };
}
