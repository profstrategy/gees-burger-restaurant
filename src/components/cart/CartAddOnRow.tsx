'use client';

import React, { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { AddOn } from '@/types/catalog';
import { formatNaira, multiply, toInt } from '@/lib/money';

export interface CartAddOnRowProps {
  lineKey?: string;
  addOn: AddOn;
  qty: number;
  itemName: string;
  onSetQty?: (nextQty: number) => void;
  onSetLineAddOnQty?: (
    lineKey: string,
    addOnId: string,
    nextQty: number
  ) => void;
}

/**
 * Indented row beneath a CartLineCard showing add-on name, "each" price,
 * independent − n + stepper, and row total (e.g. "Side of Rice − 4 + ₦20,000").
 */
export const CartAddOnRow = memo(function CartAddOnRow({
  lineKey,
  addOn,
  qty,
  itemName,
  onSetQty,
  onSetLineAddOnQty,
}: CartAddOnRowProps) {
  const unitPrice = toInt(addOn.price);
  const rowTotal = multiply(unitPrice, qty);

  const handleQtyChange = (nextQty: number) => {
    if (onSetLineAddOnQty && lineKey) {
      onSetLineAddOnQty(lineKey, addOn.id, nextQty);
    } else if (onSetQty) {
      onSetQty(nextQty);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg px-3.5 py-2.5 text-xs sm:text-sm">
      <div className="min-w-0">
        <span className="font-semibold text-text">{addOn.name}</span>
        <span className="ml-2 text-xs text-text-soft/75 tabular-nums">
          ({formatNaira(unitPrice)} each)
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div
          role="group"
          aria-label={`${addOn.name} quantity stepper for ${itemName}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface p-0.5"
        >
          <button
            type="button"
            aria-label={`Decrease ${addOn.name} quantity for ${itemName}`}
            onClick={() => handleQtyChange(qty - 1)}
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-md bg-bg text-text hover:bg-brand hover:text-on-brand transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span
            aria-live="polite"
            className="min-w-[24px] text-center font-bold text-text tabular-nums"
          >
            {qty}
          </span>
          <button
            type="button"
            disabled={qty >= 50}
            aria-label={`Increase ${addOn.name} quantity for ${itemName}`}
            onClick={() => handleQtyChange(qty + 1)}
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-md bg-brand text-on-brand hover:bg-brand-splash disabled:opacity-40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="min-w-[76px] text-right font-bold text-accent-text tabular-nums">
          {formatNaira(rowTotal)}
        </span>
      </div>
    </div>
  );
});

export default CartAddOnRow;
