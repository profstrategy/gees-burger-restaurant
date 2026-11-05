import React from 'react';
import { StageSection } from '@/components/ui/stage-section';
import { CartView } from '@/components/cart/cart-view';

export default function CartPage() {
  return (
    <main className="flex-1">
      <StageSection
        stain="top-left"
        className="py-10 sm:py-14 border-b border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
            Gee&apos;s Burger Kano · WhatsApp Ordering
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-[#F8E010]">
            YOUR CART &amp; CHECKOUT
          </h1>
          <p className="text-sm sm:text-base text-[#E6E6E6] max-w-2xl">
            Review your items, pick Delivery or Pickup at No. 32 Bompai Road,
            and send your order directly on WhatsApp.
          </p>
        </div>
      </StageSection>

      <StageSection
        stain="top-right"
        includeBottomLeftStain
        className="py-10 sm:py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CartView />
        </div>
      </StageSection>
    </main>
  );
}
