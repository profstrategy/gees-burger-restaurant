'use client';

import React from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import type { DeliveryArea, OrderSubmissionPayload } from '@/lib/api/types';
import { validatedCatalog } from '@/lib/catalog-index';
import { buildWhatsAppMessage } from '@/lib/whatsapp';

export interface WhatsAppPreviewProps {
  payload?: OrderSubmissionPayload;
  areas?: ReadonlyArray<DeliveryArea>;
  messagePreview?: string;
}

/**
 * WhatsAppPreview: monospace, read-only, rendered inside a collapsible <details>
 * (collapsed by default) by calling the same buildWhatsAppMessage() that createOrder uses,
 * so the preview can never differ from the real message.
 */
export function WhatsAppPreview({
  payload,
  areas = [],
  messagePreview,
}: WhatsAppPreviewProps) {
  const compiledText = payload
    ? buildWhatsAppMessage(validatedCatalog, areas, payload).messagePreview
    : messagePreview ?? '';

  return (
    <details className="group rounded-2xl border border-border-subtle bg-surface overflow-hidden">
      <summary className="flex items-center justify-between gap-3 min-h-[52px] px-5 py-3.5 cursor-pointer list-none select-none text-sm font-semibold text-text hover:text-accent-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
        <span className="inline-flex items-center gap-2.5">
          <MessageCircle className="h-4 w-4 text-accent-text shrink-0" />
          <span>WhatsApp compiled order preview</span>
        </span>
        <ChevronDown className="h-4 w-4 text-text-soft transition-transform duration-200 group-open:rotate-180 shrink-0" />
      </summary>

      <div className="border-t border-border-subtle bg-bg p-4 sm:p-5">
        <pre
          aria-readonly="true"
          className="rounded-xl border border-border-subtle bg-surface p-3.5 text-xs text-text whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto"
        >
          {compiledText}
        </pre>
      </div>
    </details>
  );
}

export default WhatsAppPreview;
