'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Check,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatNaira } from '@/lib/money';
import { cn } from '@/lib/utils';

const CheckoutForm = dynamic(
  () => import('@/components/cart/checkout-form'),
  {
    loading: () => (
      <div className="h-96 rounded-2xl border border-white/10 bg-[#161616] p-6 animate-pulse" />
    ),
  }
);

export function CartView() {
  const {
    state,
    isHydrated,
    totalItems,
    subtotal,
    lookup,
    getLineUnitPrice,
    getLineTotalPrice,
    setQuantity,
    removeLine,
    toggleLineAddOn,
    clearCart,
  } = useCart();

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-80 rounded-2xl border border-white/10 bg-[#161616] animate-pulse" />
        <div className="lg:col-span-5 h-96 rounded-2xl border border-white/10 bg-[#161616] animate-pulse" />
      </div>
    );
  }

  if (state.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#161616] p-10 sm:p-16 text-center space-y-6 max-w-2xl mx-auto">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#101010] border border-[#F8E010]/30">
          <ShoppingBag className="h-9 w-9 text-[#F8E010]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-4xl text-[#F8E010]">
            YOUR CART IS EMPTY
          </h2>
          <p className="text-sm sm:text-base text-[#E6E6E6] max-w-md mx-auto">
            Browse our 14 menu categories and add your favourite burgers,
            sliders, fried chicken, platters and milkshakes.
          </p>
        </div>
        <div>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#F8E010] px-7 py-3 text-base font-bold text-[#101010] hover:bg-[#F8E850] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] whitespace-nowrap shrink-0"
          >
            <span>Browse Full Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Itemized Cart Lines */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-3xl text-[#F8E010]">
              ORDER ITEMS ({totalItems})
            </h2>
            <p className="text-xs text-[#E6E6E6]/70">
              All prices are calculated live from the Gee&apos;s Burger catalog.
            </p>
          </div>

          <button
            type="button"
            aria-label="Remove all items from cart"
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-white/15 bg-[#161616] text-xs font-semibold text-[#E6E6E6] hover:border-[#E10600] hover:text-[#E10600] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="space-y-4">
          {state.lines.map((line) => {
            const item = lookup.itemsById.get(line.itemId);
            if (!item) return null;

            const variant = line.variantId
              ? lookup.variantsById.get(line.variantId)
              : undefined;
            const availableAddOns = item.addOnId
              .map((id) => lookup.addOnsById.get(id))
              .filter((a): a is NonNullable<typeof a> => Boolean(a));

            const unitPrice = getLineUnitPrice(line);
            const lineTotal = getLineTotalPrice(line);

            return (
              <article
                key={line.lineId}
                className="rounded-2xl border border-white/10 bg-[#161616] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Thumbnail or Logo on Black with faint yellow glow disc */}
                  <div className="relative h-24 w-28 sm:w-32 shrink-0 rounded-xl bg-[#101010] overflow-hidden flex items-center justify-center border border-white/5">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.item}
                        fill
                        sizes="128px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    ) : (
                      <div className="relative flex items-center justify-center w-full h-full bg-[#101010]">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute h-16 w-16 rounded-full bg-[#F8E010]/15 blur-xl"
                        />
                        <Image
                          src="/brand/gees-burger-logo.webp"
                          alt={item.item}
                          width={120}
                          height={158}
                          referrerPolicy="no-referrer"
                          className="relative z-10 min-w-[120px] w-[120px] scale-50 h-auto object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div>
                      <h3 className="font-display text-2xl text-[#F8E010] leading-tight">
                        {item.item}
                        {variant ? ` (${variant.label})` : ''}
                      </h3>
                      <p className="text-xs text-[#E6E6E6]/80 tabular-nums">
                        Unit Price:{' '}
                        <span className="font-bold text-[#F8E010]">
                          {formatNaira(unitPrice)}
                        </span>
                      </p>
                    </div>

                    {/* Interactive Add-on Chips right inside the Cart Line */}
                    {availableAddOns.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {availableAddOns.map((addOn) => {
                          const isSelected = line.addOnIds.includes(addOn.id);
                          return (
                            <button
                              key={addOn.id}
                              type="button"
                              aria-pressed={isSelected}
                              aria-label={`Toggle ${addOn.name} (+${formatNaira(
                                addOn.price
                              )}) for ${item.item}`}
                              onClick={() =>
                                toggleLineAddOn(line.lineId, addOn.id)
                              }
                              className={cn(
                                'inline-flex items-center gap-1 min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                                isSelected
                                  ? 'bg-[#F8E850]/20 text-[#F8E010] border border-[#F8E010]'
                                  : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/40'
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
                    )}
                  </div>
                </div>

                {/* Quantity Stepper & Line Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <span className="font-bold text-lg text-[#F8E010] tabular-nums">
                    {formatNaira(lineTotal)}
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl bg-[#101010] p-1 border border-white/15">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.item}`}
                        onClick={() =>
                          setQuantity(line.lineId, line.quantity - 1)
                        }
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-[#161616] text-[#F8F8F8] hover:bg-[#F8E010] hover:text-[#101010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        aria-live="polite"
                        className="min-w-[32px] text-center font-bold text-sm text-[#F8F8F8] tabular-nums"
                      >
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.item}`}
                        onClick={() =>
                          setQuantity(line.lineId, line.quantity + 1)
                        }
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-[#F8E010] text-[#101010] hover:bg-[#F8E850] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.item} from cart`}
                      onClick={() => removeLine(line.lineId)}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/10 bg-[#101010] text-[#E6E6E6] hover:border-[#E10600] hover:text-[#E10600] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-[#161616] text-sm font-semibold text-[#E6E6E6] hover:border-[#F8E010] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Add More Items</span>
          </Link>

          <div className="text-right">
            <span className="text-xs text-[#E6E6E6]/70 block">Subtotal</span>
            <span className="font-display text-3xl text-[#F8E010] tabular-nums">
              {formatNaira(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Lazy-Loaded Checkout Form */}
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <CheckoutForm />
      </div>
    </div>
  );
}
