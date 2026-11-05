'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Flame, Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import type { AddOn, EntityId, ItemVariant, MenuItem } from '@/types/catalog';
import { useCart } from '@/context/cart-context';
import { formatNaira } from '@/lib/money';
import { resolveLineUnitPrice } from '@/lib/catalog-helpers';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  variants: ItemVariant[];
  addOns: AddOn[];
  menuTitle?: string;
}

export function MenuItemCard({
  item,
  variants,
  addOns,
  menuTitle,
}: MenuItemCardProps) {
  const { lookup, addItem, state, setQuantity } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<EntityId | null>(
    () => (variants.length > 0 ? variants[0].id : null)
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<EntityId[]>([]);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = item.status === 'stock_out';

  const unitPrice = resolveLineUnitPrice(
    lookup,
    item.id,
    selectedVariantId,
    selectedAddOnIds
  );

  // Find matching line in cart for current configuration
  const normalizedSelectedAddOns = [...selectedAddOnIds].sort().join(',');
  const matchingLine = state.lines.find((line) => {
    if (line.itemId !== item.id) return false;
    if ((line.variantId ?? null) !== (selectedVariantId ?? null)) return false;
    const lineAddOns = [...line.addOnIds].sort().join(',');
    return lineAddOns === normalizedSelectedAddOns;
  });

  const toggleAddOn = (addOnId: EntityId) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      itemId: item.id,
      variantId: selectedVariantId,
      addOnIds: selectedAddOnIds,
      quantity: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161616] overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#F8E010]/40">
      <div>
        {/* Image or Branded Logo Fallback on Black with Faint Yellow Glow Disc (no corner olive square) */}
        <div className="relative aspect-[4/3] w-full bg-[#101010] overflow-hidden flex items-center justify-center border-b border-white/5">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.item}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              referrerPolicy="no-referrer"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full bg-[#101010]">
              {/* Faint yellow glow disc behind logo, no corner shape */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-36 w-36 rounded-full bg-[#F8E010]/15 blur-2xl"
              />
              <Image
                src="/brand/gees-burger-logo.webp"
                alt={`${item.item} — Gee's Burger`}
                width={120}
                height={158}
                referrerPolicy="no-referrer"
                className="relative z-10 w-[120px] h-auto object-contain opacity-90"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          {/* Quiet unboxed metadata line */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#E6E6E6]/70">
            <span>{menuTitle || 'Menu'}</span>
            {item.isSpicy && (
              <span
                className="inline-flex items-center gap-1 font-semibold text-[#E10600]"
                aria-label="Spicy dish"
              >
                <Flame className="h-3.5 w-3.5 fill-[#E10600] text-[#E10600]" />
                <span>Spicy</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl text-[#F8E010] leading-tight">
              {item.item}
            </h3>
            <span className="font-bold text-lg text-[#F8E010] tabular-nums shrink-0">
              {formatNaira(unitPrice)}
            </span>
          </div>

          {item.composition && (
            <p className="text-sm text-[#E6E6E6] leading-relaxed">
              {item.composition}
            </p>
          )}

          {/* Variants Selector Chips */}
          {variants.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <span className="block text-xs font-medium text-[#E6E6E6]/80">
                Choose Option:
              </span>
              <div
                role="radiogroup"
                aria-label={`Choose option for ${item.item}`}
                className="flex flex-wrap gap-2"
              >
                {variants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  const disabled = variant.status === 'stock_out';
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${variant.label} (${formatNaira(variant.price)})`}
                      disabled={disabled}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                        isSelected
                          ? 'bg-[#F8E010] text-[#101010]'
                          : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/60 hover:text-[#F8E010]',
                        disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span>{variant.label}</span>
                      <span className="tabular-nums opacity-85">
                        · {formatNaira(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selector Chips */}
          {addOns.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <span className="block text-xs font-medium text-[#E6E6E6]/80">
                Optional Add-ons:
              </span>
              <div
                role="group"
                aria-label={`Optional add-ons for ${item.item}`}
                className="flex flex-wrap gap-2"
              >
                {addOns.map((addOn) => {
                  const isSelected = selectedAddOnIds.includes(addOn.id);
                  const disabled = addOn.status === 'stock_out';
                  return (
                    <button
                      key={addOn.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Add ${addOn.name} for ${formatNaira(addOn.price)}`}
                      disabled={disabled}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                        isSelected
                          ? 'bg-[#F8E850]/20 text-[#F8E010] border border-[#F8E010]'
                          : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/50',
                        disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-[#F8E010] shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-[#F8E010] shrink-0" />
                      )}
                      <span>{addOn.name}</span>
                      <span className="tabular-nums font-semibold text-[#F8E010]">
                        +{formatNaira(addOn.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Action / Quantity Stepper */}
      <div className="p-5 pt-0 mt-2">
        {matchingLine ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#101010] p-1.5 border border-[#F8E010]/40">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.item}`}
              onClick={() =>
                setQuantity(matchingLine.lineId, matchingLine.quantity - 1)
              }
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-[#161616] text-[#F8F8F8] hover:bg-[#F8E010] hover:text-[#101010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span
              aria-live="polite"
              className="font-bold text-sm text-[#F8E010] tabular-nums"
            >
              {matchingLine.quantity} in cart
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.item}`}
              onClick={() =>
                setQuantity(matchingLine.lineId, matchingLine.quantity + 1)
              }
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-[#F8E010] text-[#101010] hover:bg-[#F8E850] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isOutOfStock}
            aria-label={`Add ${item.item} to cart for ${formatNaira(unitPrice)}`}
            onClick={handleAdd}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] whitespace-nowrap shrink-0',
              isOutOfStock
                ? 'bg-white/10 text-[#6B6B6B] cursor-not-allowed'
                : justAdded
                ? 'bg-[#F8E850] text-[#101010]'
                : 'bg-[#F8E010] text-[#101010] hover:bg-[#F8E850]'
            )}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : justAdded ? (
              <>
                <Check className="h-4 w-4 shrink-0" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" />
                <span>Add to Cart · {formatNaira(unitPrice)}</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
