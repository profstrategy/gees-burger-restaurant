'use client';

import React from 'react';

export interface CartLineSkeletonProps {
  count?: number;
}

/**
 * Skeleton cards (CartLineSkeleton) rendered while cart.isHydrated is false.
 */
export function CartLineSkeleton({ count = 2 }: CartLineSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading cart items"
      className="space-y-4"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 flex items-center gap-4 animate-pulse"
        >
          <div className="h-20 w-24 sm:w-28 shrink-0 rounded-xl bg-bg" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-2/3 rounded bg-text/10" />
            <div className="h-3.5 w-1/3 rounded bg-text/10" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 rounded-xl bg-text/10" />
            <div className="h-10 w-10 rounded-xl bg-text/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CartLineSkeleton;
