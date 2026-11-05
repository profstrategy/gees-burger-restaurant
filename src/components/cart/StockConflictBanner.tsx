'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { catalogIndex } from '@/lib/catalog-index';
import type { CartLine } from '@/state/types';
import { GbButton } from '@/components/ui/gb-button';

export interface StockConflictBannerProps {
  conflicts: Record<string, string>;
  lines?: CartLine[];
  onFocusFirstConflict?: () => void;
}

/**
 * Derive conflict banner copy strictly from catalog item & variant records:
 * "{Item} ({variant}) is no longer available. Choose another option or remove it."
 */
export function deriveStockConflictMessage(
  lineKey: string,
  fallbackMessage: string
): string {
  const [itemId, rawVariantId] = lineKey.split(':');
  const item = itemId ? catalogIndex.itemsById.get(itemId) : undefined;
  if (!item) return fallbackMessage;

  const variant =
    rawVariantId && rawVariantId !== '-'
      ? catalogIndex.variantsById.get(rawVariantId)
      : undefined;

  const label = variant ? `${item.item} (${variant.label})` : item.item;
  return `${label} is no longer available. Choose another option or remove it.`;
}

/**
 * Conditional page-level warning above CartLineList.
 * Dismisses itself when conflicts are empty.
 * "Update cart" scrolls to and focuses the first affected line.
 */
export function StockConflictBanner({
  conflicts,
  onFocusFirstConflict,
}: StockConflictBannerProps) {
  const entries = Object.entries(conflicts);
  if (entries.length === 0) return null;

  const handleUpdateCartClick = () => {
    if (onFocusFirstConflict) {
      onFocusFirstConflict();
      return;
    }
    if (typeof document === 'undefined') return;
    const firstConflictEl = document.querySelector<HTMLElement>(
      '[data-conflict-line]'
    );
    if (firstConflictEl) {
      firstConflictEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const selectOrBtn = firstConflictEl.querySelector<HTMLElement>(
        'select, button'
      );
      if (selectOrBtn) {
        selectOrBtn.focus({ preventScroll: true });
      } else {
        firstConflictEl.focus({ preventScroll: true });
      }
    }
  };

  return (
    <div
      role="alert"
      aria-label="Stock Conflict Warning"
      data-conflict-banner="true"
      tabIndex={-1}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F8E010] bg-[#F8E010]/10 p-4 sm:p-5 text-[#F8F8F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[#F8E010] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <ul className="space-y-1 text-xs sm:text-sm font-medium text-[#F8F8F8]">
            {entries.map(([key, rawMsg]) => (
              <li key={key}>{deriveStockConflictMessage(key, rawMsg)}</li>
            ))}
          </ul>
        </div>
      </div>

      <GbButton
        type="button"
        variant="primary"
        onClick={handleUpdateCartClick}
        className="shrink-0"
      >
        <span>Update cart</span>
      </GbButton>
    </div>
  );
}

export default StockConflictBanner;
