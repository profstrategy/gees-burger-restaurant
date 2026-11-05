import React from 'react';
import { Sparkles } from 'lucide-react';
import type { AddOn } from '@/types/catalog';
import { formatNaira } from '@/lib/money';

interface ComboBannerProps {
  comboAddOn?: AddOn;
}

/**
 * Informational-only combo banner (no "Apply" button) because the combo
 * is selectable as an add-on directly on each Sliders (x2) card.
 */
export function ComboBanner({ comboAddOn }: ComboBannerProps) {
  const name = comboAddOn?.name ?? 'Combo Upgrade (Fries & Drink)';
  const priceText = formatNaira(comboAddOn?.price ?? '5500');

  return (
    <div
      role="note"
      aria-label="Slider Combo Upgrade Information"
      className="rounded-2xl border border-[#F8E010]/30 bg-[#161616] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8E010]">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Sliders (x2) Combo Upgrade</span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl text-[#F8E010]">
          MAKE ANY SLIDER A COMBO — +{priceText}
        </h3>
        <p className="text-sm text-[#E6E6E6]">
          Select <span className="font-semibold text-[#F8F8F8]">{name}</span> directly on any Sliders (x2) card below before adding to your cart.
        </p>
      </div>
      <div className="shrink-0">
        <span className="inline-block font-display text-3xl text-[#F8E010] tabular-nums">
          +{priceText}
        </span>
      </div>
    </div>
  );
}
