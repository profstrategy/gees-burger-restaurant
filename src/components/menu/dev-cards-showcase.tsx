'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '@/types/catalog';
import { catalogIndex } from '@/lib/catalog-index';
import { formatNaira } from '@/lib/money';
import { useCart } from '@/state/context';
import { selectCartCount, selectCartTotal } from '@/state/selectors';
import { useMenuCardModel } from '@/hooks/useMenuCardModel';
import { MenuCard } from '@/components/menu/MenuCard/MenuCard';
import { GbButton } from '@/components/ui/gb-button';
import { SectionHeading } from '@/components/ui/section-heading';

interface DevCardEntryProps {
  badge: string;
  subtitle: string;
  item: MenuItem;
  priority?: boolean;
  initialExpanded?: boolean;
  enableFriedChickenPreset?: boolean;
}

function DevCardEntry({
  badge,
  subtitle,
  item,
  priority = false,
  initialExpanded = false,
  enableFriedChickenPreset = false,
}: DevCardEntryProps) {
  const model = useMenuCardModel(item, catalogIndex, { initialExpanded });

  const applyDemoPreset = () => {
    model.handlers.setExpanded(true);
    model.handlers.selectVariant('var_gee_s_fried_chicken_fried_chicken_2_pcs');
    model.handlers.setQty(3);
    model.handlers.setAddOnQty('addon_side_of_rice', 4);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5">
        <div>
          <span className="inline-block rounded bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-bold text-accent-text">
            {badge} · Derived Layout {model.layout}
          </span>
          <p className="mt-0.5 text-xs text-text-soft/80">{subtitle}</p>
        </div>

        {enableFriedChickenPreset && (
          <button
            type="button"
            onClick={applyDemoPreset}
            className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-accent-text bg-bg px-3 py-1.5 text-xs font-semibold text-accent-text hover:bg-brand hover:text-on-brand transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Select 2 pcs × 3 + Side of Rice × 4 (₦38,000)</span>
          </button>
        )}
      </div>

      <MenuCard model={model} priority={priority} className="flex-1" />
    </div>
  );
}

export function DevCardsShowcase() {
  const cart = useCart();
  const cartCount = selectCartCount(cart);
  const cartTotal = selectCartTotal(cart, catalogIndex);

  const cards = useMemo(() => {
    const getOrThrow = (id: string): MenuItem => {
      const found = catalogIndex.itemsById.get(id);
      if (!found) {
        throw new Error(`Missing catalog item "${id}" for /dev/cards`);
      }
      return found;
    };

    const friedChicken = getOrThrow('item_gee_s_fried_chicken_fried_chicken');
    const waffle = getOrThrow('item_dessert_waffle');
    const iceCream = getOrThrow('item_dessert_ice_cream');
    const chickenBiryani = getOrThrow('item_mains_chicken_biryani');
    const originalBeefSlider = getOrThrow('item_sliders_x2_original_beef');
    const buffaloWings = getOrThrow('item_starters_buffalo_chicken_wings');
    const water = getOrThrow('item_drinks_water');
    const classicBeefBurger = getOrThrow('item_burgers_classic_beef_burger');

    const forcedSoldOutItem: MenuItem = {
      ...classicBeefBurger,
      id: `${classicBeefBurger.id}__forced_sold_out`,
      item: `${classicBeefBurger.item} (Forced Sold Out)`,
      status: 'stock_out',
    };

    const forcedFallbackImageItem: MenuItem = {
      ...originalBeefSlider,
      id: `${originalBeefSlider.id}__forced_fallback`,
      item: `${originalBeefSlider.item} (Forced Fallback Image)`,
      imageUrl: '/images/menu/non-existent-broken-photo.webp',
    };

    return {
      friedChicken,
      waffle,
      iceCream,
      chickenBiryani,
      originalBeefSlider,
      buffaloWings,
      water,
      forcedSoldOutItem,
      forcedFallbackImageItem,
    };
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle pb-6">
        <SectionHeading
          align="left"
          kicker="Stage 3 Verification · /dev/cards"
          title="MENUCARD & USEMENUCARDMODEL SHOWCASE"
          subtitle="All 5 data-derived layouts (A, B, C, D, E), forced sold-out state, and automatic broken-image fallback."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs">
            <span className="text-text-soft/75 block">Live Cart Total</span>
            <span className="font-display text-2xl text-accent-text tabular-nums">
              {formatNaira(cartTotal)} ({cartCount} items)
            </span>
          </div>

          <Link href="/cart">
            <GbButton variant="primary" size="md">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>View Cart</span>
            </GbButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {/* 1. Fried Chicken (Layout A) */}
        <DevCardEntry
          badge="1. Fried Chicken"
          subtitle="Composition + Variants + Add-ons (Collapsible Layout A)"
          item={cards.friedChicken}
          priority
          enableFriedChickenPreset
        />

        {/* 2. Waffle (Layout B) */}
        <DevCardEntry
          badge="2. Waffle"
          subtitle="No Composition + Variants (Immediate Layout B)"
          item={cards.waffle}
          priority
        />

        {/* 3. Ice Cream with Cone (Layout B) */}
        <DevCardEntry
          badge="3. Ice Cream with Cone"
          subtitle="No Composition + Variants + Cone Add-on (Layout B)"
          item={cards.iceCream}
          priority
        />

        {/* 4. Chicken Biryani (Layout E) */}
        <DevCardEntry
          badge="4. Chicken Biryani"
          subtitle="Composition + No Variants + Side of Rice Add-on (Layout E)"
          item={cards.chickenBiryani}
        />

        {/* 5. Original Beef Slider (Layout E) */}
        <DevCardEntry
          badge="5. Original Beef Slider"
          subtitle="Composition + No Variants + Combo Upgrade Add-on (Layout E)"
          item={cards.originalBeefSlider}
        />

        {/* 6. Buffalo Chicken Wings (Layout D) */}
        <DevCardEntry
          badge="6. Buffalo Chicken Wings"
          subtitle="Composition + No Variants + No Add-ons + Spicy (Layout D)"
          item={cards.buffaloWings}
        />

        {/* 7. Water (Layout C) */}
        <DevCardEntry
          badge="7. Water"
          subtitle="No Composition + No Variants + No Add-ons (Simple Layout C)"
          item={cards.water}
        />

        {/* 8. Forced Sold-Out Item */}
        <DevCardEntry
          badge="8. Forced Sold-Out"
          subtitle="Dimmed card, 'Sold out' outline badge, all controls disabled"
          item={cards.forcedSoldOutItem}
        />

        {/* 9. Forced Fallback Image */}
        <DevCardEntry
          badge="9. Forced Fallback Image"
          subtitle="Broken imageUrl triggers onError -> black panel, centred logo, yellow glow disc"
          item={cards.forcedFallbackImageItem}
        />
      </div>
    </div>
  );
}
