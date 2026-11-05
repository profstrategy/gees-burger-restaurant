import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCatalogIndex } from '@/lib/catalog-index';
import { formatNaira, toInt } from '@/lib/money';
import { MenuBrowser } from '@/components/menu/menu-browser';

export const metadata: Metadata = {
  title: 'Our Menu — Burgers, Fried Chicken, Platters & Shakes',
  description:
    "Browse the full Gee's Burger menu in Kano — 14 categories including beef & chicken burgers, sliders, fried chicken buckets, shawarma, Lebanese platters, milkshakes and desserts.",
  alternates: {
    canonical: '/menu',
  },
  openGraph: {
    title: "Our Menu | Gee's Burger Kano",
    description:
      "Browse the full Gee's Burger menu in Kano — 14 categories including beef & chicken burgers, sliders, fried chicken buckets, shawarma, Lebanese platters, milkshakes and desserts.",
    url: '/menu',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Our Menu | Gee's Burger Kano",
    description:
      "Browse the full Gee's Burger menu in Kano — 14 categories including beef & chicken burgers, sliders, fried chicken buckets, shawarma, Lebanese platters, milkshakes and desserts.",
  },
};

function ServerRenderedMenuSummary() {
  const idx = getCatalogIndex();

  return (
    <div className="sr-only" aria-hidden="false">
      <h2>Gee&apos;s Burger Complete Menu Directory</h2>
      {idx.catalog.menus.map((menu) => {
        const items = menu.itemId
          .map((id) => idx.itemsById.get(id))
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (items.length === 0) return null;

        return (
          <section key={menu.id}>
            <h3>{menu.title}</h3>
            <ul>
              {items.map((item) => {
                const variants = idx.variantsByItemId.get(item.id) ?? [];
                const priceText =
                  item.price !== null
                    ? formatNaira(toInt(item.price))
                    : variants.length > 0
                    ? variants
                        .map((v) => `${v.label}: ${formatNaira(toInt(v.price))}`)
                        .join(', ')
                    : '';
                return (
                  <li key={item.id}>
                    <strong>{item.item}</strong>
                    {item.composition ? ` — ${item.composition}` : ''}
                    {priceText ? ` (${priceText})` : ''}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function MenuPage() {
  return (
    <main className="flex-1">
      <ServerRenderedMenuSummary />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="h-96 rounded-2xl border border-white/10 bg-[#161616] p-8 animate-pulse" />
          </div>
        }
      >
        <MenuBrowser />
      </Suspense>
    </main>
  );
}
