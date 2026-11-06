import React from 'react';
import { Sparkles } from 'lucide-react';
import type { AddOn } from '@/types/catalog';
import { formatNaira } from '@/lib/money';

export interface ComboBannerProps {
  comboAddOn?: AddOn;
}

/**
 * Pure helper that derives the Sliders combo informational text from the add-on record:
 * e.g. { name: "Combo Upgrade (Fries & Drink)", price: "5500" }
 * -> "Upgrade to a Combo, Fries & Drink, for ₦5,500"
 */
export function deriveSliderComboBannerText(comboAddOn?: AddOn): string {
  if (!comboAddOn) return '';
  const parenMatch = comboAddOn.name.match(/\(([^)]+)\)/);
  const includedItems = parenMatch ? parenMatch[1] : comboAddOn.name;
  const formattedPrice = formatNaira(comboAddOn.price);
  return `Upgrade to a Combo, ${includedItems}, for ${formattedPrice}`;
}

/**
 * Pure helper that derives an informational add-ons banner text from add-on records:
 * e.g. [Side of Fries (5000), Side of Rice (5000)]
 * -> "+ Side of Fries ₦5,000 · + Side of Rice ₦5,000"
 */
export function deriveMenuAddOnsBannerText(
  addOns: ReadonlyArray<AddOn>
): string {
  return addOns
    .map((addOn) => `+ ${addOn.name} ${formatNaira(addOn.price)}`)
    .join(' · ');
}

/**
 * Slim informational-only banner rendered below the Sliders (x2) block (no "Apply" button).
 */
export function ComboBanner({ comboAddOn }: ComboBannerProps) {
  if (!comboAddOn) return null;
  const text = deriveSliderComboBannerText(comboAddOn);

  return (
    <div
      role="note"
      aria-label="Slider Combo Upgrade Information"
      className="rounded-xl border border-border-subtle bg-surface px-4 py-3 flex items-center justify-center gap-2.5 text-center text-xs sm:text-sm font-medium text-text"
    >
      <Sparkles className="h-4 w-4 text-accent-text shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export interface MenuAddOnsBannerProps {
  addOns: ReadonlyArray<AddOn>;
  ariaLabel?: string;
}

/**
 * Slim informational banner rendered below Gee's Fried Chicken block, derived from add-on records.
 */
export function MenuAddOnsBanner({
  addOns,
  ariaLabel = 'Available Extras Information',
}: MenuAddOnsBannerProps) {
  if (addOns.length === 0) return null;
  const text = deriveMenuAddOnsBannerText(addOns);

  return (
    <div
      role="note"
      aria-label={ariaLabel}
      className="rounded-xl border border-border-subtle bg-surface px-4 py-3 flex items-center justify-center gap-2.5 text-center text-xs sm:text-sm font-medium text-text"
    >
      <Sparkles className="h-4 w-4 text-accent-text shrink-0" />
      <span>{text}</span>
    </div>
  );
}
