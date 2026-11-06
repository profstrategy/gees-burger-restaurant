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
import { validateAndIndexCatalog } from '@/schemas/catalog';
import { siteConfig } from '@/config/site';

export const MAX_WHATSAPP_MESSAGE_LENGTH = 1800;

export interface CatalogLookup {
  menusById: Map<EntityId, Menu>;
  subTypesById: Map<EntityId, MenuSubType>;
  subTypesByMenuId: Map<EntityId, MenuSubType[]>;
  itemsById: Map<EntityId, MenuItem>;
  variantsById: Map<EntityId, ItemVariant>;
  variantsByItemId: Map<EntityId, ItemVariant[]>;
  addOnsById: Map<EntityId, AddOn>;
}

export function buildCatalogLookup(catalog: GeesCatalog): CatalogLookup {
  const indexed = validateAndIndexCatalog(catalog);
  return {
    menusById: indexed.menusById,
    subTypesById: indexed.subTypesById,
    subTypesByMenuId: indexed.subTypesByMenuId,
    itemsById: indexed.itemsById,
    variantsById: indexed.variantsById,
    variantsByItemId: indexed.variantsByItemId,
    addOnsById: indexed.addOnsById,
  };
}

export function resolveBaseUnitPrice(
  lookup: CatalogLookup,
  itemId: EntityId,
  variantId: EntityId | null
): number {
  const item = lookup.itemsById.get(itemId);
  if (!item) return 0;

  if (variantId) {
    const variant = lookup.variantsById.get(variantId);
    return variant ? toInt(variant.price) : 0;
  }
  if (item.price !== null) {
    return toInt(item.price);
  }
  const variants = lookup.variantsByItemId.get(itemId) ?? [];
  return variants[0] ? toInt(variants[0].price) : 0;
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
  const basePrice = resolveBaseUnitPrice(lookup, itemId, variantId);
  const addOnAmounts = addOnIds.map((id) => {
    const addOn = lookup.addOnsById.get(id);
    return addOn ? addOn.price : '0';
  });
  return sum([basePrice, ...addOnAmounts]);
}

export function resolveLineTotalPrice(
  lookup: CatalogLookup,
  line: Pick<
    OrderLinePayload,
    'itemId' | 'variantId' | 'addOnIds' | 'addOns' | 'quantity'
  >
): number {
  const baseUnitPrice = resolveBaseUnitPrice(
    lookup,
    line.itemId,
    line.variantId
  );
  const baseTotal = multiply(baseUnitPrice, line.quantity);

  if (line.addOns && line.addOns.length > 0) {
    const addOnTotals = line.addOns.map((entry) => {
      const addOn = lookup.addOnsById.get(entry.addOnId);
      return addOn ? multiply(addOn.price, entry.qty) : 0;
    });
    return sum([baseTotal, ...addOnTotals]);
  }

  const addOnUnitTotal = sum(
    line.addOnIds.map((id) => lookup.addOnsById.get(id)?.price ?? '0')
  );
  return sum([baseTotal, multiply(addOnUnitTotal, line.quantity)]);
}

export function resolveCartSubtotal(
  lookup: CatalogLookup,
  lines: ReadonlyArray<
    Pick<
      OrderLinePayload,
      'itemId' | 'variantId' | 'addOnIds' | 'addOns' | 'quantity'
    >
  >
): number {
  const lineTotals = lines.map((line) => resolveLineTotalPrice(lookup, line));
  return sum(lineTotals);
}

export function resolveDeliveryFee(
  areas: ReadonlyArray<DeliveryArea>,
  fulfillment: 'pickup' | 'delivery' | null,
  deliveryAreaId: EntityId | null,
  transportMode: 'bike' | 'car' | null
): number {
  if (fulfillment !== 'delivery' || !deliveryAreaId) return 0;
  const area = areas.find((a) => a.id === deliveryAreaId);
  if (!area) return 0;
  const mode = transportMode ?? 'bike';
  return toInt(mode === 'car' ? area.carFee : area.bikeFee);
}

export interface WhatsAppMessageBuildResult {
  messagePreview: string;
  fullMessage: string;
  whatsappUrl: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Stage 5.4 buildWhatsAppMessage():
 * Exact template:
 * "Hello admin, my name is {fullName}, I ordered {items}. Total amount: {total}. Kindly send your account number for order payment. Order ref: {orderId}."
 * - {items} = lines joined by "; " such as "3 × Fried Chicken (2 pcs) + 4 × Side of Rice"
 * - For delivery append "; Delivery to {area} by {vehicle} (₦fee)"
 * - {total} is ₦55,000 and includes any delivery fee
 * - encodeURIComponent always
 * - Cap at about 1,800 characters by collapsing to "… and N more items" (full list stored with order)
 * - Until the order exists the preview shows "Order ref: (assigned on send)"
 */
export function buildWhatsAppOrderMessage(
  catalog: GeesCatalog,
  areas: ReadonlyArray<DeliveryArea>,
  payload: OrderSubmissionPayload
): WhatsAppMessageBuildResult {
  const lookup = buildCatalogLookup(catalog);
  const subtotal = resolveCartSubtotal(lookup, payload.lines);
  const deliveryFee = resolveDeliveryFee(
    areas,
    payload.fulfillment,
    payload.deliveryAreaId,
    payload.transportMode
  );
  const total = sum([subtotal, deliveryFee]);

  const itemStrings = payload.lines.map((line) => {
    const item = lookup.itemsById.get(line.itemId);
    const variant = line.variantId
      ? lookup.variantsById.get(line.variantId)
      : undefined;

    let addOnPart = '';
    if (line.addOns && line.addOns.length > 0) {
      const formattedAddOns = line.addOns
        .map((entry) => {
          const addOn = lookup.addOnsById.get(entry.addOnId);
          return addOn ? `${entry.qty} × ${addOn.name}` : null;
        })
        .filter((s): s is string => Boolean(s));
      if (formattedAddOns.length > 0) {
        addOnPart = ` + ${formattedAddOns.join(' + ')}`;
      }
    } else if (line.addOnIds.length > 0) {
      const addOns = line.addOnIds
        .map((id) => lookup.addOnsById.get(id))
        .filter((a): a is AddOn => Boolean(a));
      if (addOns.length > 0) {
        addOnPart = ` + ${addOns.map((a) => `1 × ${a.name}`).join(' + ')}`;
      }
    }

    const titlePart = item ? item.item : line.itemId;
    const variantPart = variant ? ` (${variant.label})` : '';

    return `${line.quantity} × ${titlePart}${variantPart}${addOnPart}`;
  });

  const area = payload.deliveryAreaId
    ? areas.find((a) => a.id === payload.deliveryAreaId)
    : undefined;

  const deliverySuffix =
    payload.fulfillment === 'delivery'
      ? `; Delivery to ${area ? area.name : 'Selected Area'} by ${
          payload.transportMode === 'car' ? 'Car' : 'Bike'
        } (${formatNaira(deliveryFee)})`
      : '';

  const fullNameText = (payload.customerName || '').trim() || 'Customer';
  const rawOrderId = (payload.orderId || '').trim();
  const isAssignedOrder =
    rawOrderId.length > 0 &&
    rawOrderId !== 'PREVIEW' &&
    rawOrderId !== '(assigned on send)';
  const orderRefValue = isAssignedOrder ? rawOrderId : '(assigned on send)';

  const composeSentence = (itemsText: string): string =>
    `Hello admin, my name is ${fullNameText}, I ordered ${itemsText}${deliverySuffix}. Total amount: ${formatNaira(
      total
    )}. Kindly send your account number for order payment. Order ref: ${orderRefValue}.`;

  const fullItemsText =
    itemStrings.length > 0 ? itemStrings.join('; ') : 'no items';
  const fullMessage = composeSentence(fullItemsText);

  let messagePreview = fullMessage;
  if (
    messagePreview.length > MAX_WHATSAPP_MESSAGE_LENGTH &&
    itemStrings.length > 1
  ) {
    for (let keep = itemStrings.length - 1; keep >= 1; keep--) {
      const remaining = itemStrings.length - keep;
      const collapsedItems = `${itemStrings
        .slice(0, keep)
        .join('; ')}; … and ${remaining} more items`;
      const candidate = composeSentence(collapsedItems);
      messagePreview = candidate;
      if (candidate.length <= MAX_WHATSAPP_MESSAGE_LENGTH) {
        break;
      }
    }
  }

  const rawNumber = siteConfig.adminWhatsapp;
  const cleanNumber = rawNumber?.replace(/[^\d]/g, '');
  if (!cleanNumber) {
    const errorMessage =
      'WhatsApp routing number is missing. Set NEXT_PUBLIC_ADMIN_WHATSAPP.';
    if (process.env.NODE_ENV === 'development') {
      throw new Error(errorMessage);
    }
    console.warn(errorMessage);
    throw new Error(errorMessage);
  }

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    messagePreview
  )}`;

  return {
    messagePreview,
    fullMessage,
    whatsappUrl,
    subtotal,
    deliveryFee,
    total,
  };
}

export const buildWhatsAppMessage = buildWhatsAppOrderMessage;
