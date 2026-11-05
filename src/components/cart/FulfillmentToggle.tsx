'use client';

import React from 'react';
import { Store, Truck } from 'lucide-react';
import type { FulfillmentType } from '@/lib/api/types';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export interface FulfillmentToggleProps {
  value: FulfillmentType | null;
  onChange: (value: FulfillmentType) => void;
  error?: string;
}

/**
 * FulfillmentToggle: two large buttons Pickup and Delivery (role="radiogroup").
 * Selected = solid yellow with black text.
 * No default: the user must choose, and submit stays disabled with a clear message until they do.
 * Pickup shows the address from config/site.ts as helper text.
 */
export function FulfillmentToggle({
  value,
  onChange,
  error,
}: FulfillmentToggleProps) {
  return (
    <section
      aria-label="Fulfilment option"
      className="rounded-2xl border border-white/10 bg-[#161616] p-5 sm:p-6 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="font-display text-2xl sm:text-3xl text-[#F8E010]">
          FULFILMENT METHOD
        </h2>
        <p className="text-xs text-[#E6E6E6]/80">
          Choose Pickup or Delivery to continue with your order.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose Pickup or Delivery"
        className="grid grid-cols-2 gap-3"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === 'pickup'}
          onClick={() => onChange('pickup')}
          className={cn(
            'flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl px-4 py-3 text-sm sm:text-base font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
            value === 'pickup'
              ? 'bg-[#F8E010] text-[#101010]'
              : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/60'
          )}
        >
          <Store className="h-4 w-4 shrink-0" />
          <span>Pickup</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'delivery'}
          onClick={() => onChange('delivery')}
          className={cn(
            'flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl px-4 py-3 text-sm sm:text-base font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
            value === 'delivery'
              ? 'bg-[#F8E010] text-[#101010]'
              : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/60'
          )}
        >
          <Truck className="h-4 w-4 shrink-0" />
          <span>Delivery</span>
        </button>
      </div>

      {value === null && !error && (
        <p className="text-xs text-[#F8E010]">
          Please choose Pickup or Delivery above to enable order submission.
        </p>
      )}

      {value === 'pickup' && (
        <p className="rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-xs sm:text-sm text-[#E6E6E6]">
          <span className="font-semibold text-[#F8E010]">Pickup address: </span>
          {siteConfig.address}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-[#E10600]">
          {error}
        </p>
      )}
    </section>
  );
}

export default FulfillmentToggle;
