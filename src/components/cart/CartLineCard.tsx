'use client';

import React, { memo, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import type { AddOn, ItemVariant, MenuItem } from '@/types/catalog';
import type { CartLine } from '@/state/types';
import { formatNaira, toInt } from '@/lib/money';
import { cn } from '@/lib/utils';
import { CartAddOnRow } from '@/components/cart/CartAddOnRow';

export interface CartLineCardProps {
  line: CartLine;
  item: MenuItem;
  variant?: ItemVariant;
  allVariants: ItemVariant[];
  addOnsById: Map<string, AddOn>;
  lineTotal: number;
  conflictMessage?: string;
  onSetQty?: (qty: number) => void;
  onSetVariant?: (variantId: string) => void;
  onSetAddOnQty?: (addOnId: string, qty: number) => void;
  onRemoveLine?: () => void;
  /** Stable callbacks taking `line.key` to avoid inline closures per render */
  onSetLineQty?: (lineKey: string, qty: number) => void;
  onSetLineVariant?: (lineKey: string, variantId: string) => void;
  onSetLineAddOnQty?: (
    lineKey: string,
    addOnId: string,
    qty: number
  ) => void;
  onRemoveLineByKey?: (lineKey: string) => void;
}

/**
 * CartLineCard shows thumbnail (or logo fallback), item name, variant label,
 * line total, − n + stepper, red trash icon, and indented CartAddOnRow rows beneath.
 * A line with a conflict shows a red outline and, for a variant item, a select
 * of the in-stock variants only plus Remove.
 */
export const CartLineCard = memo(function CartLineCard({
  line,
  item,
  variant,
  allVariants,
  addOnsById,
  lineTotal,
  conflictMessage,
  onSetQty,
  onSetVariant,
  onSetAddOnQty,
  onRemoveLine,
  onSetLineQty,
  onSetLineVariant,
  onSetLineAddOnQty,
  onRemoveLineByKey,
}: CartLineCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const hasConflict = Boolean(conflictMessage);
  const inStockVariants = allVariants.filter((v) => v.status !== 'stock_out');
  const resolvedImage =
    item.imageUrl && failedImageUrl !== item.imageUrl ? item.imageUrl : null;

  const handleSetQty = (nextQty: number) => {
    if (onSetLineQty) {
      onSetLineQty(line.key, nextQty);
    } else if (onSetQty) {
      onSetQty(nextQty);
    }
  };

  const handleSetVariant = (variantId: string) => {
    if (onSetLineVariant) {
      onSetLineVariant(line.key, variantId);
    } else if (onSetVariant) {
      onSetVariant(variantId);
    }
  };

  const handleSetAddOnQty = (addOnId: string, nextQty: number) => {
    if (onSetLineAddOnQty) {
      onSetLineAddOnQty(line.key, addOnId, nextQty);
    } else if (onSetAddOnQty) {
      onSetAddOnQty(addOnId, nextQty);
    }
  };

  const handleRemoveLine = () => {
    if (onRemoveLineByKey) {
      onRemoveLineByKey(line.key);
    } else if (onRemoveLine) {
      onRemoveLine();
    }
  };

  const selectedAddOns = line.addOns
    .map((entry) => {
      const addOn = addOnsById.get(entry.addOnId);
      return addOn ? { addOn, qty: entry.qty } : null;
    })
    .filter((entry): entry is { addOn: AddOn; qty: number } => Boolean(entry));

  const unselectedAvailableAddOns = item.addOnId
    .map((id) => addOnsById.get(id))
    .filter(
      (a): a is AddOn =>
        Boolean(a) &&
        a?.status !== 'stock_out' &&
        !line.addOns.some((entry) => entry.addOnId === a?.id)
    );

  return (
    <article
      data-conflict-line={hasConflict ? line.key : undefined}
      tabIndex={hasConflict ? -1 : undefined}
      className={cn(
        'rounded-2xl border bg-[#161616] p-4 sm:p-5 space-y-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
        hasConflict
          ? 'border-[#E10600] ring-1 ring-[#E10600]'
          : 'border-white/10'
      )}
    >
      {/* Main Row: Thumbnail, Item Name + Variant Label, Stepper, Line Total, Red Trash */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative h-20 w-24 sm:w-28 shrink-0 rounded-xl bg-[#101010] overflow-hidden flex items-center justify-center border border-white/5">
            {resolvedImage ? (
              <Image
                src={resolvedImage}
                alt={item.item}
                fill
                sizes="112px"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (item.imageUrl) {
                    setFailedImageUrl(item.imageUrl);
                  }
                }}
                className="object-cover"
              />
            ) : (
              <div className="relative flex items-center justify-center w-full h-full bg-[#101010]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute h-14 w-14 rounded-full bg-[#F8E010]/15 blur-xl"
                />
                <Image
                  src="/brand/gees-burger-logo.webp"
                  alt={item.item}
                  width={120}
                  height={158}
                  referrerPolicy="no-referrer"
                  className="relative z-10 min-w-[120px] w-[120px] scale-50 h-auto object-contain"
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-display text-2xl text-[#F8E010] leading-tight truncate">
              {item.item}
            </h3>
            {variant && (
              <p className="text-xs font-semibold text-[#E6E6E6]">
                {variant.label}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          <div
            role="group"
            aria-label={`Quantity stepper for ${item.item}`}
            className="flex items-center gap-1.5 rounded-xl bg-[#101010] p-1 border border-white/15"
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.item}`}
              onClick={() => handleSetQty(line.qty - 1)}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg bg-[#161616] text-[#F8F8F8] hover:bg-[#F8E010] hover:text-[#101010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span
              aria-live="polite"
              className="min-w-[30px] text-center font-bold text-sm text-[#F8F8F8] tabular-nums"
            >
              {line.qty}
            </span>
            <button
              type="button"
              disabled={line.qty >= 50}
              aria-label={`Increase quantity of ${item.item}`}
              onClick={() => handleSetQty(line.qty + 1)}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg bg-[#F8E010] text-[#101010] hover:bg-[#F8E850] disabled:opacity-40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <span className="min-w-[90px] text-right font-bold text-lg text-[#F8E010] tabular-nums">
            {formatNaira(lineTotal)}
          </span>

          <button
            type="button"
            aria-label={`Remove ${item.item} from cart`}
            onClick={handleRemoveLine}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[#E10600]/30 bg-[#101010] text-[#E10600] hover:border-[#E10600] hover:bg-[#E10600]/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conflict Resolution Row: select of in-stock variants only + Remove */}
      {hasConflict && (
        <div
          role="alert"
          className="rounded-xl border border-[#E10600]/50 bg-[#E10600]/10 p-3.5 space-y-3"
        >
          <div className="flex items-start gap-2 text-xs sm:text-sm text-[#F8F8F8]">
            <AlertTriangle className="h-4 w-4 text-[#E10600] shrink-0 mt-0.5" />
            <span>{conflictMessage}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {allVariants.length > 0 && inStockVariants.length > 0 && (
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label
                  htmlFor={`conflict-variant-${line.key}`}
                  className="sr-only"
                >
                  Choose an available option for {item.item}
                </label>
                <select
                  id={`conflict-variant-${line.key}`}
                  value={
                    inStockVariants.some((v) => v.id === line.variantId)
                      ? line.variantId ?? ''
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSetVariant(e.target.value);
                    }
                  }}
                  className="flex min-h-[42px] w-full rounded-xl border border-white/20 bg-[#101010] px-3 py-2 text-xs sm:text-sm text-[#F8F8F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
                >
                  <option value="" disabled>
                    Choose an in-stock option…
                  </option>
                  {inStockVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} — {formatNaira(v.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleRemoveLine}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] rounded-xl border border-[#E10600] bg-[#E10600] px-4 py-2 text-xs font-bold text-[#F8F8F8] hover:bg-[#E10600]/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Indented Add-On Rows beneath the line card */}
      {(selectedAddOns.length > 0 || unselectedAvailableAddOns.length > 0) && (
        <div className="pl-4 sm:pl-6 border-l-2 border-white/10 space-y-2">
          {selectedAddOns.map(({ addOn, qty }) => (
            <CartAddOnRow
              key={addOn.id}
              lineKey={line.key}
              addOn={addOn}
              qty={qty}
              itemName={item.item}
              onSetLineAddOnQty={onSetLineAddOnQty}
              onSetQty={
                onSetAddOnQty
                  ? (nextQty) => onSetAddOnQty(addOn.id, nextQty)
                  : undefined
              }
            />
          ))}

          {unselectedAvailableAddOns.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {unselectedAvailableAddOns.map((addOn) => (
                <button
                  key={addOn.id}
                  type="button"
                  onClick={() => handleSetAddOnQty(addOn.id, 1)}
                  className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-white/15 bg-[#101010] px-3 py-1.5 text-xs font-semibold text-[#E6E6E6] hover:border-[#F8E010] hover:text-[#F8E010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#F8E010]" />
                  <span>{addOn.name}</span>
                  <span className="text-[#F8E010] tabular-nums">
                    {formatNaira(toInt(addOn.price))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
});

export default CartLineCard;
