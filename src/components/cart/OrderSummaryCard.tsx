'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { FulfillmentType, TransportMode } from '@/lib/api/types';
import { formatNaira } from '@/lib/money';
import { OrderErrorBanner } from '@/components/cart/OrderErrorBanner';
import { SubmitOrderButton } from '@/components/cart/SubmitOrderButton';

export interface OrderSummaryCardProps {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: FulfillmentType | null;
  vehicle: TransportMode;
  areaName?: string;
  isSubmitting: boolean;
  hasConflicts: boolean;
  submitError?: string | null;
  formId?: string;
  onSubmitClick?: () => void;
  onRetrySubmit?: () => void;
}

/**
 * OrderSummaryCard:
 * - Subtotal
 * - Delivery fee row ONLY when Delivery is selected, showing area and vehicle
 * - Total
 * - No tax row, no promo code.
 * - Contains SubmitOrderButton.
 * - Mobile sticky bottom bar "₦total · Order via WhatsApp" with safe-area padding.
 */
export function OrderSummaryCard({
  itemCount,
  subtotal,
  deliveryFee,
  total,
  fulfillment,
  vehicle,
  areaName,
  isSubmitting,
  hasConflicts,
  submitError,
  formId,
  onSubmitClick,
  onRetrySubmit,
}: OrderSummaryCardProps) {
  const isDisabled =
    itemCount === 0 || fulfillment === null || hasConflicts;

  const vehicleLabel = vehicle === 'car' ? 'Car' : 'Bike';
  const areaAndVehicleLabel = areaName
    ? `${areaName} · ${vehicleLabel}`
    : vehicleLabel;

  return (
    <>
      <aside
        aria-label="Order summary"
        className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 space-y-6"
      >
        <div className="border-b border-border-subtle pb-3">
          <h2 className="font-display text-3xl text-accent-text">
            ORDER SUMMARY
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-text-soft">
            <span>Subtotal</span>
            <span className="font-semibold text-text tabular-nums">
              {formatNaira(subtotal)}
            </span>
          </div>

          {fulfillment === 'delivery' && (
            <div className="flex items-center justify-between text-text-soft">
              <span>Delivery fee ({areaAndVehicleLabel})</span>
              <span className="font-semibold text-text tabular-nums">
                {formatNaira(deliveryFee)}
              </span>
            </div>
          )}

          <div className="border-t border-border-subtle pt-3 flex items-center justify-between text-base font-bold">
            <span className="text-text">Total</span>
            <span className="font-display text-3xl text-accent-text tabular-nums">
              {formatNaira(total)}
            </span>
          </div>
        </div>

        {submitError && (
          <OrderErrorBanner message={submitError} onRetry={onRetrySubmit} />
        )}

        <div className="space-y-2">
          <SubmitOrderButton
            total={total}
            isSubmitting={isSubmitting}
            disabled={isDisabled}
            formId={formId}
            onClick={onSubmitClick}
          />

          {fulfillment === null && (
            <p className="text-xs text-center text-accent-text">
              Choose Pickup or Delivery to place your order.
            </p>
          )}
          {hasConflicts && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-danger">
              <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>Resolve out-of-stock items in your cart before submitting.</span>
            </p>
          )}
        </div>
      </aside>

      {/* Mobile sticky bottom bar: "₦total · Order via WhatsApp" with safe-area padding */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-bg/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto max-w-7xl">
          <SubmitOrderButton
            total={total}
            isSubmitting={isSubmitting}
            disabled={isDisabled}
            labelOverride={`${formatNaira(total)} · Order via WhatsApp`}
            formId={formId}
            onClick={onSubmitClick}
          />
        </div>
      </div>
    </>
  );
}

export default OrderSummaryCard;
