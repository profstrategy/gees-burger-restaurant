/** Gee's Burger: catalog domain types (mirror these in Prisma). */
export type EntityId = string;
export type ISODateString = string;
/** Whole naira as a digit string, no commas or symbol: "9000". Format only in the UI. */
export type Money = string;
export type StockStatus = 'in_stock' | 'stock_out';

interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Starters, Sliders (x2), Burgers ... Dessert */
export interface Menu extends Timestamps {
  id: EntityId;
  title: string;
  /** Display order of this menu's items. */
  itemId: EntityId[];
}

/** Only Drinks uses this today (Cold Drinks, Hot Drinks, Mocktails, Milkshakes). */
export interface MenuSubType extends Timestamps {
  id: EntityId;
  title: string;
  menuId: EntityId;
}

export interface MenuItem extends Timestamps {
  id: EntityId;
  item: string;
  /** null when the item is sold through ItemVariant rows. Exactly one of price / variants. */
  price: Money | null;
  composition: string | null;
  /** Public path, e.g. /images/menu/chicken-lollipop.webp. null renders the branded logo fallback card. */
  imageUrl: string | null;
  status: StockStatus;
  menuId: EntityId;
  /** Set only for items under a menu that has sub-types (Drinks). */
  subTypeId: EntityId | null;
  /** Red chili icon on the menu. */
  isSpicy: boolean;
  /** Add-ons the customer may attach to this item. */
  addOnId: EntityId[];
}

/** A priced choice of one item: "2 pcs", "12 pcs", "Nutella", "Lotus". */
export interface ItemVariant extends Timestamps {
  id: EntityId;
  itemId: EntityId;
  label: string;
  price: Money;
  status: StockStatus;
  sortOrder: number;
}

/** "+ Side of Fries 5,000": attachable to many items, charged on top of the item. */
export interface AddOn extends Timestamps {
  id: EntityId;
  name: string;
  price: Money;
  status: StockStatus;
}

export interface GeesCatalog {
  menus: Menu[];
  menuSubTypes: MenuSubType[];
  menuItems: MenuItem[];
  itemVariants: ItemVariant[];
  addOns: AddOn[];
}
