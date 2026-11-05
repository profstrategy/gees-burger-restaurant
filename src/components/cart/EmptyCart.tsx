'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GbButton } from '@/components/ui/gb-button';

/**
 * EmptyCart: logo, "Your cart is empty", button "Back to menu".
 * Shown only after hydration with zero lines.
 */
export function EmptyCart() {
  return (
    <div
      role="region"
      aria-label="Empty Cart"
      className="rounded-3xl border border-white/10 bg-[#161616] p-10 sm:p-16 text-center space-y-6 max-w-xl mx-auto"
    >
      <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-[#101010] p-4 border border-white/10">
        <Image
          src="/brand/gees-burger-logo.webp"
          alt="Gee's Burger"
          width={120}
          height={158}
          referrerPolicy="no-referrer"
          className="min-w-[120px] w-[120px] h-auto object-contain"
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010]">
          Your cart is empty
        </h2>
        <p className="text-sm sm:text-base text-[#E6E6E6] max-w-md mx-auto">
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
