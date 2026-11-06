'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Minus,
  Plus,
} from 'lucide-react';
import { GbButton } from '@/components/ui/gb-button';
import { OrbitCard } from '@/components/ui/orbit-card';
import type {
  MenuCardAddOnOption,
  MenuCardHandlers,
  MenuCardVariantOption,
  MenuCardViewModel,
} from '@/hooks/useMenuCardModel';
import { MAX_CART_QTY, MIN_CART_QTY } from '@/state/slices/cart.reducer';
import { cn } from '@/lib/utils';

export interface MenuCardProps {
  /** Pure view model produced by `useMenuCardModel(item, catalogIndex)` */
  model: MenuCardViewModel;
  /** Eager loading for the first row of cards on screen; defaults to false (lazy) */
  priority?: boolean;
  className?: string;
}

interface VariantPickerProps {
  itemId: string;
  itemName: string;
  variants: MenuCardVariantOption[];
  selectedVariantId: string | null;
  isSoldOut: boolean;
  onSelectVariant: (variantId: string) => void;
}

function VariantPicker({
  itemId,
  itemName,
  variants,
  selectedVariantId,
  isSoldOut,
  onSelectVariant,
}: VariantPickerProps) {
  return (
    <div className="space-y-2">
      <span
        id={`variant-label-${itemId}`}
        className="block text-[11px] font-semibold uppercase tracking-wider text-text-soft"
      >
        Choose variant:
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`variant-label-${itemId}`}
        aria-label={`Choose variant for ${itemName}`}
        className="grid grid-cols-2 gap-2"
      >
        {variants.map((v) => {
          const isSelected = selectedVariantId === v.id && !v.disabled;
          const isDisabled = isSoldOut || v.disabled;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              onClick={() => onSelectVariant(v.id)}
              className={cn(
                'flex items-center justify-between gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                isSelected
                  ? 'bg-brand text-on-brand font-bold border-2 border-accent-text'
                  : 'bg-bg text-text border border-border hover:border-border-hover cursor-pointer',
                v.disabled &&
                  'line-through opacity-45 cursor-not-allowed hover:border-border',
                isSoldOut && 'cursor-not-allowed'
              )}
            >
              <span className="truncate">{v.label}</span>
              <span
                className={cn(
                  'tabular-nums shrink-0 font-bold',
                  isSelected ? 'text-on-brand' : 'text-accent-text',
                  v.disabled && 'line-through text-text-disabled'
                )}
              >
                {v.formattedPrice}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface AddOnPickerProps {
  itemName: string;
  addOns: MenuCardAddOnOption[];
  isSoldOut: boolean;
  handlers: Pick<
    MenuCardHandlers,
    'toggleAddOn' | 'incrementAddOnQty' | 'decrementAddOnQty'
  >;
}

function AddOnPicker({
  itemName,
  addOns,
  isSoldOut,
  handlers,
}: AddOnPickerProps) {
  if (addOns.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-soft">
        Choose add-ons:
      </span>
      <div className="flex flex-col gap-2">
        {addOns.map((addOn) => {
          const isDisabled = isSoldOut || addOn.disabled;
          return (
            <div
              key={addOn.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <button
                type="button"
                aria-pressed={addOn.selected}
                disabled={isDisabled}
                onClick={() => handlers.toggleAddOn(addOn.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  addOn.selected
                    ? 'bg-brand-splash/20 text-accent-text border-2 border-accent-text font-semibold cursor-pointer'
                    : 'bg-bg text-text-soft border border-border hover:border-border-hover cursor-pointer',
                  isDisabled &&
                    'opacity-45 line-through cursor-not-allowed hover:border-border'
                )}
              >
                {addOn.selected ? (
                  <Check className="h-3.5 w-3.5 text-accent-text shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-accent-text shrink-0" />
                )}
                <span>{addOn.name}</span>
                <span className="tabular-nums font-bold text-accent-text">
                  +{addOn.formattedPrice}
                </span>
              </button>

              {addOn.selected && !isDisabled && (
                <div
                  role="group"
                  aria-label={`${addOn.name} quantity stepper for ${itemName}`}
                  className="inline-flex items-center gap-1 rounded-full bg-bg p-1 border border-border"
                >
                  <button
                    type="button"
                    aria-label={`Decrease ${addOn.name} quantity for ${itemName}`}
                    disabled={addOn.qty <= MIN_CART_QTY}
                    onClick={() => handlers.decrementAddOnQty(addOn.id)}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-surface text-text hover:bg-brand hover:text-on-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-[26px] text-center font-bold text-xs text-accent-text tabular-nums"
                  >
                    {addOn.qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${addOn.name} quantity for ${itemName}`}
                    disabled={addOn.qty >= MAX_CART_QTY}
                    onClick={() => handlers.incrementAddOnQty(addOn.id)}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-brand text-on-brand hover:bg-brand-splash disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Purely presentational, React.memo'd MenuCard component.
 * Never reads the catalog or cart directly; driven strictly by `model: MenuCardViewModel`.
 */
export const MenuCard = memo(function MenuCard({
  model,
  priority = false,
  className,
}: MenuCardProps) {
  const {
    itemId,
    name,
    composition,
    layout,
    resolvedImage,
    isSpicy,
    isSoldOut,
    variants,
    firstVariantHint,
    addOns,
    selectedVariantId,
    qty,
    formattedUnitPrice,
    formattedLineTotal,
    canAdd,
    justAdded,
    isExpanded,
    handlers,
  } = model;

  const showCollapsibleHeaderPrice = layout === 'A' && !isExpanded && firstVariantHint;

  return (
    <OrbitCard
      as="article"
      data-layout={layout}
      data-sold-out={isSoldOut ? 'true' : 'false'}
      className={cn(
        'flex flex-col overflow-hidden transition-opacity',
        isSoldOut && 'opacity-65',
        className
      )}
    >
      {/* Top 16:10 Media Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg flex items-center justify-center">
        {resolvedImage ? (
          <Image
            src={resolvedImage}
            alt={name}
            fill
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            referrerPolicy="no-referrer"
            onError={handlers.handleImageError}
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        ) : (
          /* No photo / fallback: black panel, centred logo (min width 120px), soft yellow glow disc, no corner shape */
          <div className="relative flex h-full w-full items-center justify-center bg-fixed-dark-bg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-32 w-32 rounded-full bg-brand/15 blur-2xl"
            />
            <Image
              src="/brand/gees-burger-logo.webp"
              alt={`${name} — Gee's Burger`}
              width={800}
              height={1134}
              loading={priority ? 'eager' : 'lazy'}
              referrerPolicy="no-referrer"
              className="relative z-10 min-w-[120px] w-[120px] h-auto object-contain opacity-90 select-none"
            />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-20">
          {isSpicy ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-danger px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-on-danger shadow-md">
              <Flame className="h-3.5 w-3.5 fill-current shrink-0" />
              <span>Spicy</span>
            </span>
          ) : (
            <span />
          )}

          {isSoldOut && (
            <span className="inline-flex items-center rounded-md border border-border bg-bg/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-text">
              Sold out
            </span>
          )}
        </div>
      </div>

      {/* Card Body derived strictly from `layout` */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-4">
        <div className="space-y-3">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl sm:text-[26px] leading-[1.05] text-accent-text tracking-wide">
              {name}
            </h3>

            <div className="text-right shrink-0">
              {showCollapsibleHeaderPrice ? (
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg text-accent-text tabular-nums whitespace-nowrap">
                    from {firstVariantHint.formattedPrice}
                  </span>
                  <span className="text-[11px] text-text-soft/75">
                    from {firstVariantHint.label}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-lg sm:text-xl text-accent-text tabular-nums whitespace-nowrap">
                  {formattedUnitPrice}
                </span>
              )}
            </div>
          </div>

          {/* Description: shown for Layouts A, D, and E (when composition exists) */}
          {(layout === 'A' || layout === 'D' || layout === 'E') &&
            composition && (
              <p className="text-xs sm:text-sm text-text-soft/85 leading-relaxed">
                {composition}
              </p>
            )}

          {/* Layout A: Collapsible Variant + Optional Add-on Picker */}
          {layout === 'A' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                aria-expanded={isExpanded}
                disabled={isSoldOut}
                onClick={handlers.toggleExpanded}
                className={cn(
                  'flex w-full items-center justify-between gap-2 min-h-[44px] rounded-xl border border-border bg-bg px-3.5 py-2 text-xs font-semibold text-text hover:border-border-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  isSoldOut && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="truncate">
                  {isExpanded
                    ? 'Hide options'
                    : firstVariantHint
                    ? `Customize options · from ${firstVariantHint.label} (${firstVariantHint.formattedPrice})`
                    : 'Customize options'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-accent-text shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-accent-text shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-3 rounded-xl border border-border-subtle bg-bg/60 p-3">
                  <VariantPicker
                    itemId={itemId}
                    itemName={name}
                    variants={variants}
                    selectedVariantId={selectedVariantId}
                    isSoldOut={isSoldOut}
                    onSelectVariant={handlers.selectVariant}
                  />
                  <AddOnPicker
                    itemName={name}
                    addOns={addOns}
                    isSoldOut={isSoldOut}
                    handlers={handlers}
                  />
                </div>
              )}
            </div>
          )}

          {/* Layout B: Variants shown immediately, add-ons with steppers, no description, no collapse */}
          {layout === 'B' && (
            <div className="space-y-3 pt-1">
              <VariantPicker
                itemId={itemId}
                itemName={name}
                variants={variants}
                selectedVariantId={selectedVariantId}
                isSoldOut={isSoldOut}
                onSelectVariant={handlers.selectVariant}
              />
              <AddOnPicker
                itemName={name}
                addOns={addOns}
                isSoldOut={isSoldOut}
                handlers={handlers}
              />
            </div>
          )}

          {/* Layout E: Add-ons only (description shown above if present) */}
          {layout === 'E' && (
            <div className="pt-1">
              <AddOnPicker
                itemName={name}
                addOns={addOns}
                isSoldOut={isSoldOut}
                handlers={handlers}
              />
            </div>
          )}
        </div>

        {/* Bottom Action Row: Item Quantity Stepper (1–50) + Dirty-Yellow Add Button */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div
            role="group"
            aria-label={`Quantity stepper for ${name}`}
            className="flex items-center gap-1 rounded-xl bg-bg p-1 border border-border shrink-0"
          >
            <button
              type="button"
              aria-label={`Decrease quantity for ${name}`}
              disabled={isSoldOut || qty <= MIN_CART_QTY}
              onClick={handlers.decrementQty}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-surface text-text hover:bg-brand hover:text-on-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span
              aria-live="polite"
              className="min-w-[30px] text-center font-bold text-sm text-text tabular-nums"
            >
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity for ${name}`}
              disabled={isSoldOut || qty >= MAX_CART_QTY}
              onClick={handlers.incrementQty}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-brand text-on-brand hover:bg-brand-splash disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Dirty-Yellow Add Button */}
          <GbButton
            variant="primary"
            size="md"
            disabled={!canAdd || isSoldOut}
            onClick={handlers.handleAdd}
            className="flex-1 min-h-[44px]"
          >
            {isSoldOut ? (
              <span>Sold out</span>
            ) : justAdded ? (
              <span>Added ✓</span>
            ) : (
              <span>Add {formattedLineTotal}</span>
            )}
          </GbButton>
        </div>
      </div>
    </OrbitCard>
  );
});
