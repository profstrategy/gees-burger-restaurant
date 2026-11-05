import { siteConfig } from '@/config/site';
import { getCatalogIndex } from '@/lib/catalog-index';

export function getBaseUrl(): string {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://geesburger.com';
}

export interface RestaurantJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  telephone: string;
  url: string;
  servesCuisine: string[];
  hasMenu: {
    '@type': 'Menu';
    name: string;
    url: string;
    hasMenuSection: Array<{
      '@type': 'MenuSection';
      name: string;
      hasMenuItem: Array<{
        '@type': 'MenuItem';
        name: string;
        description?: string;
        offers?: {
          '@type': 'Offer';
          price: string;
          priceCurrency: 'NGN';
        };
      }>;
    }>;
  };
}

/**
 * Builds Schema.org Restaurant JSON-LD strictly from siteConfig and catalog.json.
 * Includes: name, address, telephone, servesCuisine, hasMenu.
 * Explicitly omits aggregateRating, openingHours/openingHoursSpecification, and priceRange.
 */
export function buildRestaurantJsonLd(): RestaurantJsonLd {
  const baseUrl = getBaseUrl();
  const idx = getCatalogIndex();

  const hasMenuSection = idx.catalog.menus
    .map((menu) => {
      const items = menu.itemId
        .map((id) => idx.itemsById.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (items.length === 0) return null;

      return {
        '@type': 'MenuSection' as const,
        name: menu.title,
        hasMenuItem: items.map((item) => {
          const variants = idx.variantsByItemId.get(item.id) ?? [];
          const rawPrice =
            item.price !== null
              ? item.price
              : variants[0]?.price ?? undefined;

          return {
            '@type': 'MenuItem' as const,
            name: item.item,
            ...(item.composition ? { description: item.composition } : {}),
            ...(rawPrice
              ? {
                  offers: {
                    '@type': 'Offer' as const,
                    price: rawPrice,
                    priceCurrency: 'NGN' as const,
                  },
                }
              : {}),
          };
        }),
      };
    })
    .filter((sec): sec is NonNullable<typeof sec> => Boolean(sec));

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteConfig.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 32 Bompai Road, opposite Grand Square',
      addressLocality: 'Kano',
      addressRegion: 'Kano State',
      addressCountry: 'NG',
    },
    telephone: siteConfig.phone,
    url: baseUrl,
    servesCuisine: [
      'Burgers',
      'Fried Chicken',
      'Shawarma',
      'Lebanese',
      'Milkshakes',
      'Desserts',
    ],
    hasMenu: {
      '@type': 'Menu',
      name: `${siteConfig.name} Menu`,
      url: `${baseUrl}/menu`,
      hasMenuSection,
    },
  };
}
