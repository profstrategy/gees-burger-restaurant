'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { catalogValidationSummary, itemsById } from '@/lib/catalog-index';
import { formatNaira } from '@/lib/money';
import { siteConfig } from '@/config/site';
import { OrbitCard } from '@/components/ui/orbit-card';
import { GbButton } from '@/components/ui/gb-button';
import { SectionHeading } from '@/components/common/section-heading';

/**
 * Logs catalog validation summary to the browser console on mount
 * (`140 items, 0 warnings`) and renders the Stage 1 Foundation Showcase:
 * - SectionHeading (`───── ✦ ─────`)
 * - One `.gb-orbit` card (with IntersectionObserver `data-inview`)
 * - Both `GbButton` variants (`primary` and `ghost`), plus loading and disabled states
 * - Catalog validation summary (`140 items, 0 warnings`)
 */
export function FoundationShowcase() {
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    console.info(
      `[Gee's Burger Catalog] Validated ${catalogValidationSummary.itemsCount} items, ${catalogValidationSummary.warningsCount} warnings (${catalogValidationSummary.menusCount} menus, ${catalogValidationSummary.subTypesCount} sub-types, ${catalogValidationSummary.variantsCount} variants, ${catalogValidationSummary.addOnsCount} add-ons).`
    );
  }, []);

  const triggerLoadingDemo = () => {
    setDemoLoading(true);
    window.setTimeout(() => setDemoLoading(false), 900);
  };

  const sampleItem = itemsById.get('item_burgers_classic_beef_burger');

  return (
    <div className="space-y-10">
      <SectionHeading
        kicker="Stage 1 · Foundation System"
        title="DESIGN TOKENS, ORBIT CARD & CATALOG INTEGRITY"
        subtitle={`Validated ${catalogValidationSummary.itemsCount} catalog items across ${catalogValidationSummary.menusCount} menus with ${catalogValidationSummary.warningsCount} warnings.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* 1. Single Featured .gb-orbit Card */}
        <div className="lg:col-span-5 flex">
          <OrbitCard className="w-full p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full rounded-xl bg-[#101010] overflow-hidden flex items-center justify-center">
                {sampleItem?.imageUrl ? (
                  <Image
                    src={sampleItem.imageUrl}
                    alt={sampleItem.item}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                ) : (
                  <div className="relative flex items-center justify-center w-full h-full bg-[#101010]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute h-32 w-32 rounded-full bg-[#F8E010]/15 blur-2xl"
                    />
                    <Image
                      src="/brand/gees-burger-logo.webp"
                      alt="Gee's Burger"
                      width={120}
                      height={158}
                      referrerPolicy="no-referrer"
                      className="relative z-10 w-[120px] min-w-[120px] h-auto object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-3xl text-[#F8E010]">
                  {sampleItem?.item ?? 'Classic Beef Burger'}
                </h3>
                <span className="font-bold text-xl text-[#F8E010] tabular-nums">
                  {formatNaira(sampleItem?.price ?? '10000')}
                </span>
              </div>

              <p className="text-sm text-[#E6E6E6] leading-relaxed">
                {sampleItem?.composition}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#E6E6E6]/75">
              <span>Orbiting Border (.gb-orbit)</span>
              <span>data-inview=&quot;true&quot; active</span>
            </div>
          </OrbitCard>
        </div>

        {/* 2. Dirty-Yellow Buttons (Primary & Ghost) + Catalog Check */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161616] p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-display text-2xl text-[#F8E010]">
              DIRTY-YELLOW WIPE BUTTONS (GB-BUTTON)
            </h3>
            <p className="text-sm text-[#E6E6E6]">
              Hover, focus, or press to trigger the left-to-right{' '}
              <span className="text-[#F8E010] font-semibold">#F8E010</span> wipe
              with synchronized black label transition.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <GbButton variant="primary" onClick={triggerLoadingDemo}>
                Primary Dirty-Yellow Button
              </GbButton>

              <GbButton variant="ghost" onClick={triggerLoadingDemo}>
                Ghost Dirty-Yellow Button
              </GbButton>

              <GbButton
                variant="primary"
                loading={demoLoading}
                onClick={triggerLoadingDemo}
              >
                {demoLoading ? 'Processing Order...' : 'Test Loading State'}
              </GbButton>

              <GbButton variant="ghost" disabled>
                Disabled Button
              </GbButton>
            </div>
          </div>

          {/* 3. Zod Catalog Validation & Site Config Readout */}
          <div className="rounded-xl border border-white/10 bg-[#101010] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F8E010]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Zod Catalog Validator Status</span>
              </div>
              <span className="text-xs font-mono text-[#F8E010] tabular-nums">
                {catalogValidationSummary.itemsCount} items ·{' '}
                {catalogValidationSummary.warningsCount} warnings
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
              <div className="rounded-lg bg-[#161616] p-3">
                <span className="block text-[#E6E6E6]/70">Menus</span>
                <span className="font-display text-2xl text-[#F8E010] tabular-nums">
                  {catalogValidationSummary.menusCount}
                </span>
              </div>
              <div className="rounded-lg bg-[#161616] p-3">
                <span className="block text-[#E6E6E6]/70">Sub-Types</span>
                <span className="font-display text-2xl text-[#F8E010] tabular-nums">
                  {catalogValidationSummary.subTypesCount}
                </span>
              </div>
              <div className="rounded-lg bg-[#161616] p-3">
                <span className="block text-[#E6E6E6]/70">Items</span>
                <span className="font-display text-2xl text-[#F8E010] tabular-nums">
                  {catalogValidationSummary.itemsCount}
                </span>
              </div>
              <div className="rounded-lg bg-[#161616] p-3">
                <span className="block text-[#E6E6E6]/70">Variants</span>
                <span className="font-display text-2xl text-[#F8E010] tabular-nums">
                  {catalogValidationSummary.variantsCount}
                </span>
              </div>
              <div className="rounded-lg bg-[#161616] p-3">
                <span className="block text-[#E6E6E6]/70">Add-Ons</span>
                <span className="font-display text-2xl text-[#F8E010] tabular-nums">
                  {catalogValidationSummary.addOnsCount}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#E6E6E6]/80 pt-1">
              {siteConfig.name} · {siteConfig.address} · Tel: {siteConfig.phone}{' '}
              · @{siteConfig.socialHandle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
