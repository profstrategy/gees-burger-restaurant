'use client';

import React from 'react';
import { AlertCircle, Store, Truck } from 'lucide-react';
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
      className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="font-display text-2xl sm:text-3xl text-accent-text">
          FULFILMENT METHOD
        </h2>
        <p className="text-xs text-text-soft/80">
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
            'flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl px-4 py-3 text-sm sm:text-base font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
            value === 'pickup'
              ? 'bg-brand text-on-brand border-2 border-accent-text'
              : 'bg-bg text-text-soft border border-border hover:border-border-hover'
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
            'flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl px-4 py-3 text-sm sm:text-base font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
            value === 'delivery'
              ? 'bg-brand text-on-brand border-2 border-accent-text'
              : 'bg-bg text-text-soft border border-border hover:border-border-hover'
          )}
        >
          <Truck className="h-4 w-4 shrink-0" />
          <span>Delivery</span>
        </button>
      </div>

      {value === null && !error && (
        <p className="text-xs text-accent-text">
          Please choose Pickup or Delivery above to enable order submission.
        </p>
      )}

      {value === 'pickup' && (
        <p className="rounded-xl border border-border-subtle bg-bg px-4 py-3 text-xs sm:text-sm text-text-soft">
          <span className="font-semibold text-accent-text">Pickup address: </span>
          {siteConfig.address}
        </p>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </section>
  );
}

export default FulfillmentToggle;
