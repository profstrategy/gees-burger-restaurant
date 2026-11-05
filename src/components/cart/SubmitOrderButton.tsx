'use client';

import React from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { formatNaira } from '@/lib/money';
import { GbButton } from '@/components/ui/gb-button';
import { cn } from '@/lib/utils';

export interface SubmitOrderButtonProps {
  total: number;
  isSubmitting: boolean;
  disabled?: boolean;
  labelOverride?: string;
  formId?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * SubmitOrderButton: dirty-yellow primary, label "Order via WhatsApp · ₦{total}".
 * States: idle, submitting (spinner, label "Sending your order…", disabled),
 * disabled (empty cart, no fulfilment chosen, or a conflict exists).
 * Never double-submits.
 */
export function SubmitOrderButton({
  total,
  isSubmitting,
  disabled = false,
  labelOverride,
  formId,
  onClick,
  className,
}: SubmitOrderButtonProps) {
  return (
    <GbButton
      type={formId ? 'submit' : onClick ? 'button' : 'submit'}
      form={formId}
      variant="primary"
      disabled={isSubmitting || disabled}
      aria-busy={isSubmitting}
      onClick={onClick}
      className={cn('w-full min-h-[50px] text-sm sm:text-base font-bold', className)}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Sending your order…</span>
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="tabular-nums">
            {labelOverride ?? `Order via WhatsApp · ${formatNaira(total)}`}
          </span>
        </>
      )}
    </GbButton>
  );
}

export default SubmitOrderButton;
