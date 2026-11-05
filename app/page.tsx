import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, UtensilsCrossed } from 'lucide-react';
import catalogData from '@/data/catalog.json';
import type { GeesCatalog } from '@/types/catalog';
import { buildCatalogLookup } from '@/lib/catalog-helpers';
import { formatNaira } from '@/lib/money';
import { StageSection } from '@/components/ui/stage-section';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { ComboBanner } from '@/components/menu/combo-banner';
import { BelowFoldHomeSections } from '@/components/home/below-fold-sections';

const catalog = catalogData as GeesCatalog;

const FEATURED_ITEM_IDS = [
  'item_burgers_classic_beef_burger',
  'item_sliders_x2_original_beef',
  'item_gee_s_fried_chicken_fried_chicken',
  'item_platters_whole_grilled_chicken_platter',
  'item_sandwiches_twister_chicken_wrap',
  'item_appetizers_chicken_lollipop',
];

export default function HomePage() {
  const lookup = buildCatalogLookup(catalog);

  const featuredItems = FEATURED_ITEM_IDS.map((id) =>
    lookup.itemsById.get(id)
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const kidsMealMenu = lookup.menusById.get('menu_kids_meal');
  const kidsMealItems = (kidsMealMenu?.itemId ?? [])
    .map((id) => lookup.itemsById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const comboAddOn = lookup.addOnsById.get('addon_combo_upgrade');

  return (
    <main className="flex-1">
      {/* Section 1: Hero Stage (top-right stain) */}
      <StageSection
        stain="top-right"
        className="py-12 sm:py-20 border-b border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
                <span>No. 32 Bompai Road, Kano</span>
                <span aria-hidden="true">·</span>
                <span>Pickup &amp; Delivery via WhatsApp</span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#F8E010] leading-[0.95] text-balance">
                FLAME-GRILLED BURGERS, CRISPY FRIED CHICKEN &amp; LEBANESE PLATTERS
              </h1>

              <p className="text-base sm:text-lg text-[#E6E6E6] max-w-2xl leading-relaxed">
                Explore {catalog.menus.length} menu categories from signature
                Sliders (x2) and Classic Beef Burgers to Gee&apos;s Fried Chicken
                buckets, Suya &amp; Mixed Grill platters, and creamy milkshakes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#F8E010] px-7 py-3 text-base font-bold text-[#101010] transition-colors hover:bg-[#F8E850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010] whitespace-nowrap shrink-0"
                >
                  <UtensilsCrossed className="h-5 w-5 shrink-0" />
                  <span>Explore Full Menu</span>
                </Link>

                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-[#F8E010]/40 bg-[#161616] px-6 py-3 text-base font-semibold text-[#F8F8F8] transition-colors hover:border-[#F8E010] hover:text-[#F8E010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] whitespace-nowrap shrink-0"
                >
                  <span>Go to Cart</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>

              {/* Clean unboxed category quick-links from catalog */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-[#E6E6E6]/70 mb-2">
                  Browse Categories ({catalog.menus.length} Menus):
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#E6E6E6]">
                  {catalog.menus.map((menu, idx) => (
                    <React.Fragment key={menu.id}>
                      <Link
                        href={`/menu?menu=${menu.id}`}
                        className="inline-flex items-center min-h-[44px] hover:text-[#F8E010] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded px-1"
                      >
                        {menu.title}
                      </Link>
                      {idx < catalog.menus.length - 1 && (
                        <span aria-hidden="true" className="text-[#6B6B6B]">
                          ·
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Visual Anchor: Gee's Fried Chicken Bucket */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-white/10 bg-[#161616] p-6 sm:p-8 flex flex-col items-center text-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-auto h-64 w-64 rounded-full bg-[#F8E010]/15 blur-3xl"
                />
                <div className="relative aspect-square w-full max-w-[360px]">
                  <Image
                    src="/images/hero/bucket-hero.webp"
                    alt="Gee's Fried Chicken Bucket"
                    fill
                    priority
                    sizes="(max-width: 1024px) 360px, 420px"
                    referrerPolicy="no-referrer"
                    className="object-contain"
                  />
                </div>
                <div className="relative z-10 mt-4 space-y-1">
                  <p className="font-display text-3xl text-[#F8E010]">
                    GEE&apos;S FRIED CHICKEN
                  </p>
                  <p className="text-sm text-[#E6E6E6]">
                    2 pcs ({formatNaira('6000')}) up to 16 pcs (
                    {formatNaira('34000')}) · Served with coleslaw &amp; garlic
                    mayo sauce
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StageSection>

      {/* Section 2: Featured Favorites Grid (top-left + bottom-left stain) */}
      <StageSection
        stain="top-left"
        includeBottomLeftStain
        className="py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
                From the Kitchen
              </p>
              <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010] text-balance">
                SIGNATURE FAVOURITES
              </h2>
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-[#161616] text-sm font-semibold text-[#F8E010] hover:border-[#F8E010] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <span>See All {catalog.menuItems.length} Dishes</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>

          <ComboBanner comboAddOn={comboAddOn} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredItems.map((item) => {
              const menu = lookup.menusById.get(item.menuId);
              const variants = lookup.variantsByItemId.get(item.id) ?? [];
              const addOns = item.addOnId
                .map((id) => lookup.addOnsById.get(id))
                .filter((a): a is NonNullable<typeof a> => Boolean(a));

              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  variants={variants}
                  addOns={addOns}
                  menuTitle={menu?.title}
                />
              );
            })}
          </div>
        </div>
      </StageSection>

      {/* Section 3: Kids Meal Spotlight (top-right stain) */}
      <StageSection
        stain="top-right"
        className="py-16 sm:py-20 border-t border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center rounded-3xl border border-white/10 bg-[#161616] p-6 sm:p-10">
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-56 w-56 rounded-full bg-[#F8E010]/15 blur-3xl"
              />
              <div className="relative aspect-[4/3] w-full max-w-md">
                <Image
                  src="/images/hero/kids-meal-hero.webp"
                  alt="Gee's Burger Kids Meal box with fries, slider, and juice"
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
                  {kidsMealMenu?.title ?? 'Kids Meal'} · Served with Fries &amp; Juice
                </p>
                <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010] text-balance">
                  GEE&apos;S KIDS MEAL BOXES — {formatNaira('8500')} EACH
                </h2>
                <p className="text-sm sm:text-base text-[#E6E6E6] leading-relaxed">
                  Every Kids Meal is served with french fries (or rice with
                  Chicken Strips) and a juice pack.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kidsMealItems.map((kidItem) => (
                  <div
                    key={kidItem.id}
                    className="rounded-xl border border-white/10 bg-[#101010] p-4 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl text-[#F8E010]">
                        {kidItem.item}
                      </h3>
                      <span className="font-bold text-sm text-[#F8E010] tabular-nums">
                        {formatNaira(kidItem.price)}
                      </span>
                    </div>
                    {kidItem.composition && (
                      <p className="text-xs text-[#E6E6E6]/85 leading-relaxed">
                        {kidItem.composition}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Link
                  href="/menu?menu=menu_kids_meal"
                  className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-[#F8E010] px-6 py-2.5 text-sm font-bold text-[#101010] hover:bg-[#F8E850] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] whitespace-nowrap shrink-0"
                >
                  <span>Order Kids Meal</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </StageSection>

      {/* Lazy-Loaded Below-the-Fold Sections (Reviews, FAQ, Newsletter) */}
      <BelowFoldHomeSections />
    </main>
  );
}
