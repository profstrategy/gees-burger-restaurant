'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { GbButton } from '@/components/ui/gb-button';

export interface OrderErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/**
 * OrderErrorBanner: inline error with a Retry button for network and timeout failures.
 * The form data is never lost.
 */
export function OrderErrorBanner({ message, onRetry }: OrderErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-label="Order Submission Failed"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E10600] bg-[#E10600]/10 p-4 text-xs sm:text-sm text-[#F8F8F8]"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-[#E10600] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-[#F8F8F8]">Order could not be sent</p>
          <p className="text-[#E6E6E6]">{message}</p>
        </div>
      </div>

      {onRetry && (
        <GbButton
          type="button"
          variant="ghost"
          onClick={onRetry}
          className="shrink-0 min-h-[40px] px-3.5 py-1.5 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Retry</span>
        </GbButton>
      )}
    </div>
  );
}

export default OrderErrorBanner;
