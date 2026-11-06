'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, X } from 'lucide-react';
import type { AddOn } from '@/types/catalog';
import { api } from '@/lib/api';
import { getCatalogIndex } from '@/lib/catalog-index';
import { formatNaira } from '@/lib/money';
import { validateAndIndexCatalog } from '@/schemas/catalog';
import { useCatalogSearch } from '@/hooks/use-catalog-search';
import { useChipScroller } from '@/hooks/useChipScroller';
import { actions } from '@/state/actions';
import { useCart, useCatalogFilter, useDispatch } from '@/state/context';
import {
  selectCartCount,
  selectCartTotal,
  selectVisibleMenus,
} from '@/state/selectors';
import { Input } from '@/components/ui/input';
import { GbButton } from '@/components/ui/gb-button';
import { SectionHeading } from '@/components/common/section-heading';
import { StageSection } from '@/components/ui/stage-section';
import { ComboBanner, MenuAddOnsBanner } from '@/components/menu/combo-banner';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { cn } from '@/lib/utils';

export function MenuBrowser() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const cart = useCart();
  const filter = useCatalogFilter();

  const {
    rawQuery,
    debouncedQuery,
    menuId,
    subTypeId,
    setRawQuery,
    clearQuery,
    selectMenu,
    selectSubType,
    resetAll,
  } = useCatalogSearch(300);

  const [catalogIndex, setCatalogIndex] = useState(() => getCatalogIndex());
  const didInitFromUrlRef = useRef(false);

  const {
    scrollerRef: menuScrollerRef,
    hasRightOverflow: menuHasRightOverflow,
    handleChipClick: handleMenuChipClick,
  } = useChipScroller();
  const {
    scrollerRef: subTypeScrollerRef,
    hasRightOverflow: subTypeHasRightOverflow,
    handleChipClick: handleSubTypeChipClick,
  } = useChipScroller();

  // 1. Initialise query, menu, sub from URL (?q=&menu=&sub=), guarded for preview safety
  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    didInitFromUrlRef.current = true;

    try {
      const qParam =
        searchParams?.get('q') ??
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('q')
          : null);
      const menuParam =
        searchParams?.get('menu') ??
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('menu')
          : null);
      const subParam =
        searchParams?.get('sub') ??
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('sub')
          : null);

      if (qParam && qParam.trim().length > 0) {
        setRawQuery(qParam);
        dispatch(actions.search.setQuery(qParam));
      }

      if (menuParam && catalogIndex.menusById.has(menuParam)) {
        dispatch(actions.search.setMenu(menuParam));
        const subTypesForMenu =
          catalogIndex.subTypesByMenuId.get(menuParam) ?? [];
        if (subParam && subTypesForMenu.some((s) => s.id === subParam)) {
          dispatch(actions.search.setSubType(subParam));
        }
      }
    } catch {
      // Guarded so the page works even if URL / searchParams are unavailable
    }
  }, [catalogIndex, dispatch, searchParams, setRawQuery]);

  // 2. Mirror query, menu, sub to the URL (?q=&menu=&sub=), guarded
  useEffect(() => {
    if (!didInitFromUrlRef.current) return;
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim().length > 0) {
        params.set('q', debouncedQuery.trim());
      }
      if (menuId) {
        params.set('menu', menuId);
      }
      if (subTypeId) {
        params.set('sub', subTypeId);
      }

      const queryString = params.toString();
      const basePath = pathname || window.location.pathname || '/menu';
      const nextUrl = queryString ? `${basePath}?${queryString}` : basePath;
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (nextUrl !== currentUrl) {
        window.history.replaceState(window.history.state, '', nextUrl);
      }
    } catch {
      // Guarded if history.replaceState is restricted in iframe preview
    }
  }, [debouncedQuery, menuId, pathname, subTypeId]);

  // 3. Optional background catalog refresh with AbortController
  useEffect(() => {
    const controller = new AbortController();
    api
      .getCatalog(controller.signal)
      .then((data) => {
        setCatalogIndex(validateAndIndexCatalog(data));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  // Menus that have at least one item, in catalog order
  const nonEmptyMenus = useMemo(
    () =>
      catalogIndex.catalog.menus.filter((menu) => {
        return menu.itemId.some((id) => catalogIndex.itemsById.has(id));
      }),
    [catalogIndex]
  );

  // Sub-types for the currently selected menu (e.g. Drinks)
  const activeMenuSubTypes = useMemo(
    () => (menuId ? catalogIndex.subTypesByMenuId.get(menuId) ?? [] : []),
    [catalogIndex.subTypesByMenuId, menuId]
  );

  const activeMenuRecord = menuId
    ? catalogIndex.menusById.get(menuId)
    : undefined;

  const visibleSections = useMemo(
    () => selectVisibleMenus(filter, catalogIndex),
    [filter, catalogIndex]
  );

  const totalVisibleDishes = useMemo(
    () =>
      visibleSections.reduce((acc, sec) => acc + sec.items.length, 0),
    [visibleSections]
  );

  // Add-on records for informational banners derived strictly from catalog
  const sliderComboAddOn = catalogIndex.addOnsById.get('addon_combo_upgrade');

  const friedChickenAddOns = useMemo(() => {
    const fcMenu = catalogIndex.menusById.get('menu_gee_s_fried_chicken');
    if (!fcMenu) return [];
    const seen = new Set<string>();
    const list: AddOn[] = [];
    for (const itemId of fcMenu.itemId) {
      const item = catalogIndex.itemsById.get(itemId);
      if (!item) continue;
      for (const addOnId of item.addOnId) {
        if (seen.has(addOnId)) continue;
        seen.add(addOnId);
        const addOn = catalogIndex.addOnsById.get(addOnId);
        if (addOn) {
          list.push(addOn);
        }
      }
    }
    return list;
  }, [catalogIndex]);

  const cartCount = cart.isHydrated ? selectCartCount(cart) : 0;
  const cartTotal = cart.isHydrated ? selectCartTotal(cart, catalogIndex) : 0;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      clearQuery();
    }
  };

  return (
    <div className=" pb-24 md:pb-12">
      {/* Top Heading + Search Input Stage */}
      <StageSection
        stain="top-right"
        className="py-10 sm:py-14 border-b border-border-subtle"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeading
            as="h1"
            title="OUR MENU"
            subtitle="Explore all 14 menu categories, customize variants and extras, and order via WhatsApp."
          />

          <div className="mx-auto max-w-xl space-y-2">
            <div className="relative">
              <label htmlFor="menu-search" className="sr-only">
                Search dishes or ingredients
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
              <Input
                id="menu-search"
                type="search"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search burgers, sliders, jalapeño, shawarma..."
                className="pl-10 pr-10 bg-surface"
              />
              {rawQuery.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={clearQuery}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-[40px] min-w-[40px] text-text-soft hover:text-accent-text rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results count in an aria-live region */}
            <p
              role="status"
              aria-live="polite"
              className="text-center text-xs text-text-soft/80 tabular-nums"
            >
              {debouncedQuery.trim()
                ? `${totalVisibleDishes} ${
                    totalVisibleDishes === 1 ? 'dish matches' : 'dishes match'
                  } '${debouncedQuery.trim()}'`
                : `Showing ${totalVisibleDishes} ${
                    totalVisibleDishes === 1 ? 'dish' : 'dishes'
                  } across ${visibleSections.length} ${
                    visibleSections.length === 1 ? 'menu' : 'menus'
                  }`}
            </p>
          </div>
        </div>
      </StageSection>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[69px] z-30 border-b border-border-subtle bg-bg/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
          {/* Row 1: All + Every Menu with >= 1 item */}
          <div className="relative">
            <div
              ref={menuScrollerRef}
              role="group"
              aria-label="Filter by menu category"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-8"
            >
              <button
                type="button"
                data-chip="true"
                aria-pressed={menuId === null}
                onClick={(e) => {
                  selectMenu(null);
                  handleMenuChipClick(e.currentTarget);
                }}
                className={cn(
                  'inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  menuId === null
                    ? 'bg-brand text-on-brand border-2 border-accent-text'
                    : 'bg-surface text-text-soft border border-border hover:border-border-hover hover:text-accent-text'
                )}
              >
                All
              </button>

              {nonEmptyMenus.map((menu) => {
                const isSelected = menuId === menu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    data-chip="true"
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      selectMenu(menu.id);
                      handleMenuChipClick(e.currentTarget);
                    }}
                    className={cn(
                      'inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                      isSelected
                        ? 'bg-brand text-on-brand font-bold border-2 border-accent-text'
                        : 'bg-surface text-text-soft border border-border hover:border-border-hover hover:text-accent-text'
                    )}
                  >
                    {menu.title}
                  </button>
                );
              })}
            </div>

            {/* Right-edge fade showing horizontal overflow */}
            {menuHasRightOverflow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg to-transparent"
              />
            )}
          </div>

          {/* Row 2: Sub-types row when a menu with sub-types (Drinks) is selected */}
          {activeMenuSubTypes.length > 0 && (
            <div className="relative pt-1 border-t border-border-subtle">
              <div
                ref={subTypeScrollerRef}
                role="group"
                aria-label={`Filter ${activeMenuRecord?.title ?? 'Drinks'} by sub-type`}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-8"
              >
                <button
                  type="button"
                  data-chip="true"
                  aria-pressed={subTypeId === null}
                  onClick={(e) => {
                    selectSubType(null);
                    handleSubTypeChipClick(e.currentTarget);
                  }}
                  className={cn(
                    'inline-flex items-center justify-center min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                    subTypeId === null
                      ? 'bg-brand text-on-brand border-2 border-accent-text'
                      : 'bg-surface text-text-soft border border-border hover:border-border-hover hover:text-accent-text'
                  )}
                >
                  All {activeMenuRecord?.title ?? 'Drinks'}
                </button>

                {activeMenuSubTypes.map((sub) => {
                  const isSelected = subTypeId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      data-chip="true"
                      aria-pressed={isSelected}
                      onClick={(e) => {
                        selectSubType(sub.id);
                        handleSubTypeChipClick(e.currentTarget);
                      }}
                      className={cn(
                        'inline-flex items-center justify-center min-h-[44px] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                        isSelected
                          ? 'bg-brand text-on-brand font-bold border-2 border-accent-text'
                          : 'bg-surface text-text-soft border border-border hover:border-border-hover hover:text-accent-text'
                      )}
                    >
                      {sub.title}
                    </button>
                  );
                })}
              </div>

              {subTypeHasRightOverflow && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg to-transparent"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Results Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-14">
        {/* Empty State */}
        {visibleSections.length === 0 && (
          <div className="rounded-2xl border border-border-subtle bg-surface p-12 text-center space-y-5 max-w-xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl text-accent-text break-words">
              {(debouncedQuery || rawQuery).trim()
                ? `No dishes match ‘${(debouncedQuery || rawQuery).trim()}’`
                : 'No dishes match your current filter'}
            </h2>
            <p className="text-sm text-text-soft">
              Try searching for another dish or clear your filter to see the
              full catalog.
            </p>
            <div className="flex justify-center">
              <GbButton
                type="button"
                variant="primary"
                onClick={() => {
                  resetAll();
                }}
              >
                <span>Clear search</span>
              </GbButton>
            </div>
          </div>
        )}

        {/* Menu Sections with alternating .gb-stage background stains */}
        {visibleSections.map((section, menuIdx) => {
          const { menu, items: itemsForMenu, subTypes } = section;
          const stainPos = menuIdx % 2 === 0 ? 'top-left' : 'top-right';
          const isLongSection = itemsForMenu.length >= 9;
          const showSubTypeHeadings =
            subTypes.length > 0 && subTypeId === null;

          return (
            <StageSection
              key={menu.id}
              id={menu.id}
              stain={stainPos}
              includeBottomLeftStain={isLongSection}
              className="py-6 sm:py-8 space-y-8"
            >
              <SectionHeading title={menu.title} />

              {/* Drinks grouped by sub-type with smaller heading when "All Drinks" is active */}
              {showSubTypeHeadings ? (
                <div className="space-y-10">
                  {subTypes.map((group, groupIdx) => (
                    <div key={group.subType.id} className="space-y-4">
                      <h3 className="font-display text-2xl sm:text-3xl text-accent-text border-b border-border-subtle pb-2">
                        {group.subType.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.items.map((item, itemIdx) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            catalogIndex={catalogIndex}
                            priority={
                              menuIdx === 0 && groupIdx === 0 && itemIdx < 3
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsForMenu.map((item, itemIdx) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      catalogIndex={catalogIndex}
                      priority={menuIdx === 0 && itemIdx < 3}
                    />
                  ))}
                </div>
              )}

              {/* Slim informational banner BELOW the Sliders (x2) block derived from addon_combo_upgrade */}
              {menu.id === 'menu_sliders_x2' && (
                <ComboBanner comboAddOn={sliderComboAddOn} />
              )}

              {/* Slim informational banner BELOW Gee's Fried Chicken block derived from add-on records */}
              {menu.id === 'menu_gee_s_fried_chicken' && (
                <MenuAddOnsBanner
                  addOns={friedChickenAddOns}
                  ariaLabel="Gee's Fried Chicken Available Extras"
                />
              )}
            </StageSection>
          );
        })}
      </div>

      {/* Mobile Sticky Cart Bar ("N items · ₦total · View cart") shown after the first add */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-bg/95 backdrop-blur-md p-3 shadow-2xl">
          <Link
            href="/cart"
            className="flex w-full items-center justify-between gap-3 min-h-[48px] rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-on-brand hover:bg-brand-splash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span className="inline-flex items-center gap-2 tabular-nums">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} ·{' '}
                {formatNaira(cartTotal)}
              </span>
            </span>
            <span>View cart →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
