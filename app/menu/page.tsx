import React, { Suspense } from 'react';
import { StageSection } from '@/components/ui/stage-section';
import { MenuBrowser } from '@/components/menu/menu-browser';

export default function MenuPage() {
  return (
    <main className="flex-1">
      <StageSection
        stain="top-right"
        className="py-10 sm:py-14 border-b border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
            Gee&apos;s Burger Kano · Full Catalog
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-[#F8E010]">
            OUR MENU
          </h1>
          <p className="text-sm sm:text-base text-[#E6E6E6] max-w-2xl">
            Choose your dishes, customize variants and add-ons, and send your
            order directly to our team on WhatsApp.
          </p>
        </div>
      </StageSection>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Suspense
          fallback={
            <div className="h-96 rounded-2xl border border-white/10 bg-[#161616] p-8 animate-pulse" />
          }
        >
          <MenuBrowser />
        </Suspense>
      </div>
    </main>
  );
}
