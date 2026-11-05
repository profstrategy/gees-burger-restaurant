import type { EntityId } from '@/types/catalog';

export const siteConfig = {
  name: "Gee's Burger",
  address: 'No. 32 Bompai Road, opposite Grand Square, Kano, Nigeria',
  phone: '09166606000',
  socialHandle: 'gees.burgers',
  social: 'gees.burgers',
  adminWhatsapp:
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '2349166606000',
  featuredItemIds: [
    'item_gee_s_fried_chicken_fried_chicken',
    'item_burgers_classic_beef_burger',
    'item_appetizers_chicken_lollipop',
    'item_sandwiches_twister_chicken_wrap',
    'item_drinks_oreo',
  ] as const satisfies ReadonlyArray<EntityId>,
} as const;

export type SiteConfig = typeof siteConfig;
