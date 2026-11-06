'use client';

import React from 'react';
import Link from 'next/link';
import { GbButton } from '@/components/ui/gb-button';
import { Logo } from '@/components/common/Logo';

/**
 * EmptyCart: logo, "Your cart is empty", button "Back to menu".
 * Shown only after hydration with zero lines.
 */
export function EmptyCart() {
  return (
    <div
      role="region"
      aria-label="Empty Cart"
      className="rounded-3xl border border-border-subtle bg-surface p-10 sm:p-16 text-center space-y-6 max-w-xl mx-auto"
    >
      <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-surface-2 p-4 border border-border-subtle">
        <Logo
          darkClassName="h-auto w-[120px] min-w-[120px] object-contain"
          lightClassName="h-auto w-[120px] min-w-[120px] object-contain"
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-4xl sm:text-5xl text-accent-text">
          Your cart is empty
        </h2>
        <p className="text-sm sm:text-base text-text-soft max-w-md mx-auto">
          Head to our menu to add burgers, sliders, fried chicken, platters, or
          milkshakes.
        </p>
      </div>

      <div className="flex justify-center">
        <GbButton asChild variant="primary">
          <Link href="/menu">
            <span>Back to menu</span>
          </Link>
        </GbButton>
      </div>
    </div>
  );
}

export default EmptyCart;
