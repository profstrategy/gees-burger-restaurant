'use client';

import React from 'react';
import { Minus, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { GbButton } from '@/components/ui/gb-button';
import { OrbitCard } from '@/components/ui/orbit-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { useCatalogSearch } from '@/hooks/use-catalog-search';
import { catalogIndex } from '@/lib/catalog-index';
import { formatNaira } from '@/lib/money';
import { actions } from '@/state/actions';
import { useAlerts, useCart, useDispatch } from '@/state/context';
import {
  selectCartCount,
  selectCartTotal,
  selectLineTotal,
  selectVisibleMenus,
} from '@/state/selectors';

export function StateDebugPanel() {
  const cart = useCart();
  const alerts = useAlerts();
  const dispatch = useDispatch();
  const {
    rawQuery,
    debouncedQuery,
    menuId,
    subTypeId,
    setRawQuery,
    setMenu,
    setSubType,
    resetFilters,
  } = useCatalogSearch();

  const cartTotal = selectCartTotal(cart, catalogIndex);
  const cartCount = selectCartCount(cart);
  const visibleMenus = selectVisibleMenus(
    { query: debouncedQuery, menuId, subTypeId },
    catalogIndex
  );

  const visibleItemsCount = visibleMenus.reduce(
    (acc, group) => acc + group.items.length,
    0
  );

  const handleAddDemoCase = () => {
    dispatch(
      actions.cartAddLine({
        itemId: 'item_gee_s_fried_chicken_fried_chicken',
        variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
        qty: 3,
        addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
      })
    );
    dispatch(
      actions.alertsPush({
        id: `demo-case-${Date.now()}`,
        severity: 'success',
        title: 'Demo Preset Added',
        message: '3 × Fried Chicken (2 pcs) + 4 × Side of Rice = ₦38,000',
        dedupeKey: 'demo-preset-38000',
        createdAt: Date.now(),
      })
    );
  };

  const handleAddSampleSlider = () => {
    dispatch(
      actions.cartAddLine({
        itemId: 'item_sliders_x2_original_beef',
        variantId: null,
        qty: 1,
        addOns: [{ addOnId: 'addon_combo_upgrade', qty: 1 }],
      })
    );
  };

  const handlePushSampleAlerts = () => {
    const now = Date.now();
    dispatch(
      actions.alertsPush({
        id: `alert-info-${now}`,
        severity: 'info',
        title: 'Persistence Active',
        message: 'Cart state persists to localStorage key "gees.cart.v1".',
        dedupeKey: 'persistence-info',
        createdAt: now,
      })
    );
  };

  return (
    <div className="space-y-8 pt-10 border-t border-border-subtle">
      <SectionHeading
        eyebrow="Stage 2 Verification"
        title="DOMAIN STATE & SELECTORS DEBUG"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cart State & Demo Case Inspector */}
        <OrbitCard className="lg:col-span-7 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent-text font-semibold">
                Cart Slice (gees.cart.v1)
              </p>
              <h3 className="font-display text-3xl text-accent-text">
                DERIVED TOTAL: {formatNaira(cartTotal)} ({cartCount} ITEMS)
              </h3>
            </div>
            <span className="rounded-lg border border-border bg-bg px-3 py-1 text-xs text-text-soft">
              Hydrated: {cart.isHydrated ? 'true' : 'false'}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <GbButton
              variant="primary"
              size="sm"
              onClick={handleAddDemoCase}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Add Demo: 3× Fried Chicken (2 pcs) + 4× Side of Rice (₦38,000)</span>
            </GbButton>

            <GbButton
              variant="ghost"
              size="sm"
              onClick={handleAddSampleSlider}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Original Beef Slider + Combo</span>
            </GbButton>

            <GbButton
              variant="ghost"
              size="sm"
              onClick={handlePushSampleAlerts}
            >
              <span>Test Alert Toast</span>
            </GbButton>

            {cart.lines.length > 0 && (
              <GbButton
                variant="ghost"
                size="sm"
                onClick={() => dispatch(actions.cartClear())}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>Clear Cart</span>
              </GbButton>
            )}
          </div>

          {cart.lines.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-bg p-4 text-xs text-text-soft/75">
              Cart is empty. Use the buttons above to add lines and reload the
              page to verify localStorage hydration.
            </p>
          ) : (
            <div className="space-y-3">
              {cart.lines.map((line) => {
                const item = catalogIndex.itemsById.get(line.itemId);
                const variant = line.variantId
                  ? catalogIndex.variantsById.get(line.variantId)
                  : undefined;
                const lineTotal = selectLineTotal(line, catalogIndex);

                return (
                  <div
                    key={line.key}
                    className="rounded-xl border border-border-subtle bg-bg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-text">
                        {item?.item ?? line.itemId}
                        {variant ? ` (${variant.label})` : ''}
                      </p>
                      <p className="text-[11px] font-mono text-text-disabled">
                        key: {line.key}
                      </p>
                      {line.addOns.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {line.addOns.map((entry) => {
                            const addOn = catalogIndex.addOnsById.get(
                              entry.addOnId
                            );
                            return (
                              <span
                                key={entry.addOnId}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-brand-splash/10 px-2 py-0.5 text-[11px] text-accent-text"
                              >
                                {entry.qty}× {addOn?.name ?? entry.addOnId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="font-bold text-sm text-accent-text tabular-nums mr-1">
                        {formatNaira(lineTotal)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${line.key}`}
                        onClick={() =>
                          dispatch(
                            actions.cartSetQty({
                              key: line.key,
                              qty: line.qty - 1,
                            })
                          )
                        }
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-surface text-text hover:border-accent-text"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[24px] text-center font-bold text-sm tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${line.key}`}
                        onClick={() =>
                          dispatch(
                            actions.cartSetQty({
                              key: line.key,
                              qty: line.qty + 1,
                            })
                          )
                        }
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-brand text-on-brand"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove line ${line.key}`}
                        onClick={() =>
                          dispatch(actions.cartRemoveLine({ key: line.key }))
                        }
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-surface text-text-soft hover:border-danger hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OrbitCard>

        {/* Search & Diacritic Filter Inspector */}
        <OrbitCard className="lg:col-span-5 p-6 space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <p className="text-xs uppercase tracking-widest text-accent-text font-semibold">
              Catalog Filter &amp; Alerts Slice
            </p>
            <h3 className="font-display text-2xl text-accent-text">
              SELECTVISIBLEMENUS ({visibleMenus.length} MENUS / {visibleItemsCount} ITEMS)
            </h3>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="debug-catalog-query"
              className="block text-xs font-medium text-text-soft"
            >
              Debounced Query (300 ms, diacritic-insensitive)
            </label>
            <div className="flex gap-2">
              <input
                id="debug-catalog-query"
                type="search"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Try: jalapeno"
                className="flex-1 min-h-[44px] rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              />
              <button
                type="button"
                onClick={() => setRawQuery('jalapeno')}
                className="min-h-[44px] rounded-xl border border-border bg-bg px-3 text-xs font-semibold text-accent-text hover:bg-brand hover:text-on-brand transition-colors cursor-pointer"
              >
                Test &ldquo;jalapeno&rdquo;
              </button>
              <button
                type="button"
                aria-label="Reset catalog filters"
                onClick={() => {
                  resetFilters();
                  setMenu(null);
                  setSubType(null);
                }}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-border bg-bg text-text-soft hover:border-accent-text"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg p-3 text-xs space-y-1.5">
            <p className="text-text-soft">
              Active Query:{' '}
              <span className="font-mono text-accent-text">
                &ldquo;{debouncedQuery}&rdquo;
              </span>
            </p>
            <p className="text-text-soft">
              Alerts in Queue (max 3):{' '}
              <span className="font-mono text-accent-text">
                {alerts.queue.length}
              </span>
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
              {visibleMenus.map((group) => (
                <div
                  key={group.menu.id}
                  className="flex items-center justify-between text-[11px] text-text-soft/80 border-t border-border-subtle pt-1"
                >
                  <span>{group.menu.title}</span>
                  <span className="font-mono text-accent-text">
                    {group.items.length} items
                    {group.subTypeGroups
                      ? ` (${group.subTypeGroups.length} sub-types)`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </OrbitCard>
      </div>
    </div>
  );
}
