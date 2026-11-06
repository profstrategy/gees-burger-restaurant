'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react';
import type { OrderSubmissionResult } from '@/lib/api/types';
import { GbButton } from '@/components/ui/gb-button';

export interface OrderSuccessPanelProps {
  result: OrderSubmissionResult;
  onReset?: () => void;
}

/**
 * OrderSuccessPanel: replaces the form area after success.
 * Shows "Order sent", the order ref, and a button "Open WhatsApp"
 * as a fallback in case the popup was blocked, plus "Back to menu".
 */
export function OrderSuccessPanel({
  result,
  onReset,
}: OrderSuccessPanelProps) {
  return (
    <section
      role="region"
      aria-label="Order sent"
      className="rounded-3xl border border-accent-text bg-surface p-6 sm:p-10 space-y-6"
    >
      <div className="flex items-start gap-4">
        <CheckCircle2 className="h-8 w-8 text-accent-text shrink-0 mt-1" />
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-text">
            Ref: #{result.orderId}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-accent-text">
            Order sent
          </h2>
          <p className="text-sm text-text-soft">
            Your order reference is <strong className="text-text">#{result.orderId}</strong>.
            If WhatsApp did not open automatically, tap &ldquo;Open WhatsApp&rdquo; below to send your order message.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg p-4">
        <pre
          aria-readonly="true"
          className="text-xs text-text whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto"
        >
          {result.messagePreview}
        </pre>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-brand px-6 py-3 text-base font-bold text-on-brand hover:bg-brand-splash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring whitespace-nowrap shrink-0"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span>Open WhatsApp</span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>

        <GbButton
          asChild
          variant="ghost"
          onClick={onReset}
          className="min-h-[48px]"
        >
          <Link href="/menu">
            <span>Back to menu</span>
          </Link>
        </GbButton>
      </div>
    </section>
  );
}

export default OrderSuccessPanel;
