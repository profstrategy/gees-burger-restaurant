'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, Search, X } from 'lucide-react';
import catalogFallback from '@/data/catalog.json';
import type { GeesCatalog, MenuItem } from '@/types/catalog';
import { api } from '@/lib/api';
import { buildCatalogLookup } from '@/lib/catalog-helpers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Input } from '@/components/ui/input';
import { StageSection } from '@/components/ui/stage-section';
import { ComboBanner } from '@/components/menu/combo-banner';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { cn } from '@/lib/utils';

export function MenuBrowser() {
  const searchParams = useSearchParams();
  const menuFromUrl = searchParams.get('menu') || 'all';

  const [catalog, setCatalog] = useState<GeesCatalog>(
    catalogFallback as GeesCatalog
  );
  const [selectedMenuState, setSelectedMenuState] = useState<{
    urlKey: string;
    menuId: string;
  }>({
    urlKey: menuFromUrl,
    menuId: menuFromUrl,
  });

  const activeMenuId =
    selectedMenuState.urlKey === menuFromUrl
      ? selectedMenuState.menuId
      : menuFromUrl;

  const setActiveMenuId = useCallback(
    (nextMenuId: string) => {
      setSelectedMenuState({
        urlKey: menuFromUrl,
        menuId: nextMenuId,
      });
    },
    [menuFromUrl]
  );

  const [activeSubTypeId, setActiveSubTypeId] = useState<string>('all');
  const [spicyOnly, setSpicyOnly] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');

  // Debounce search at 300ms (not seconds)
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Network fetch with AbortController
  useEffect(() => {
    const controller = new AbortController();
    api
      .getCatalog(controller.signal)
      .then((data) => {
        setCatalog(data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  const lookup = useMemo(() => buildCatalogLookup(catalog), [catalog]);
  const comboAddOn = lookup.addOnsById.get('addon_combo_upgrade');

  const normalizedQuery = debouncedSearch.trim().toLowerCase();

  const visibleMenus = useMemo(() => {
    if (activeMenuId === 'all') {
      return catalog.menus;
    }
    return catalog.menus.filter((m) => m.id === activeMenuId);
  }, [catalog.menus, activeMenuId]);

  const filterItem = useCallback(
    (item: MenuItem): boolean => {
      if (spicyOnly && !item.isSpicy) return false;
      if (
        item.menuId === 'menu_drinks' &&
        activeSubTypeId !== 'all' &&
        item.subTypeId !== activeSubTypeId
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      const nameMatch = item.item.toLowerCase().includes(normalizedQuery);
      const compMatch = item.composition
        ? item.composition.toLowerCase().includes(normalizedQuery)
        : false;
      return nameMatch || compMatch;
    },
    [spicyOnly, activeSubTypeId, normalizedQuery]
  );

  // Count total matching items across visible menus
  const totalMatchingCount = useMemo(() => {
    let count = 0;
    for (const menu of visibleMenus) {
      for (const id of menu.itemId) {
        const item = lookup.itemsById.get(id);
        if (item && filterItem(item)) {
          count += 1;
        }
      }
    }
    return count;
  }, [visibleMenus, lookup, filterItem]);

  const drinkSubTypes = useMemo(
    () => catalog.menuSubTypes.filter((st) => st.menuId === 'menu_drinks'),
    [catalog.menuSubTypes]
  );

  return (
    <div className="space-y-8">
      {/* Search & Category Controls Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#161616] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input (debounced at 300ms) */}
          <div className="relative flex-1 max-w-xl">
            <label htmlFor="menu-search" className="sr-only">
              Search menu items or ingredients
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            <Input
              id="menu-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search burgers, sliders, shawarma, shakes..."
              className="pl-10 pr-10 bg-[#101010]"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => setSearchInput('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-[40px] min-w-[40px] text-[#E6E6E6] hover:text-[#F8E010] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Spicy Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-pressed={spicyOnly}
              aria-label="Filter spicy dishes only"
              onClick={() => setSpicyOnly((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                spicyOnly
                  ? 'bg-[#E10600] text-[#F8F8F8]'
                  : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#E10600]'
              )}
            >
              <Flame className="h-4 w-4 shrink-0" />
              <span>Spicy Only</span>
            </button>

            {(activeMenuId !== 'all' ||
              activeSubTypeId !== 'all' ||
              spicyOnly ||
              searchInput) && (
              <button
                type="button"
                aria-label="Reset all menu filters"
                onClick={() => {
                  setActiveMenuId('all');
                  setActiveSubTypeId('all');
                  setSpicyOnly(false);
                  setSearchInput('');
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-[#E6E6E6] hover:text-[#F8E010] bg-[#101010] border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 14 Menu Category Filter Chips */}
        <div
          role="tablist"
          aria-label="Menu categories"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMenuId === 'all'}
            aria-label="Show all menu categories"
            onClick={() => {
              setActiveMenuId('all');
              setActiveSubTypeId('all');
            }}
            className={cn(
              'inline-flex items-center min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
              activeMenuId === 'all'
                ? 'bg-[#F8E010] text-[#101010]'
                : 'bg-[#101010] text-[#E6E6E6] border border-white/10 hover:border-[#F8E010]/50 hover:text-[#F8E010]'
            )}
          >
            All Menus ({catalog.menuItems.length})
          </button>

          {catalog.menus.map((menu) => {
            const isSelected = activeMenuId === menu.id;
            return (
              <button
                key={menu.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Filter by ${menu.title} (${menu.itemId.length} items)`}
                onClick={() => {
                  setActiveMenuId(menu.id);
                  setActiveSubTypeId('all');
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                  isSelected
                    ? 'bg-[#F8E010] text-[#101010]'
                    : 'bg-[#101010] text-[#E6E6E6] border border-white/10 hover:border-[#F8E010]/50 hover:text-[#F8E010]'
                )}
              >
                <span>{menu.title}</span>
                <span className="tabular-nums opacity-75">
                  ({menu.itemId.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Drink Sub-Type Chips when Drinks is active or visible */}
        {(activeMenuId === 'menu_drinks' || activeMenuId === 'all') && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#E6E6E6]/70 mr-1">
              Drinks Sub-types:
            </span>
            <button
              type="button"
              aria-pressed={activeSubTypeId === 'all'}
              aria-label="All drink sub-types"
              onClick={() => setActiveSubTypeId('all')}
              className={cn(
                'inline-flex items-center min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                activeSubTypeId === 'all'
                  ? 'bg-[#F8E850]/20 text-[#F8E010] border border-[#F8E010]'
                  : 'bg-[#101010] text-[#E6E6E6] border border-white/10 hover:border-[#F8E010]/40'
              )}
            >
              All Drinks
            </button>
            {drinkSubTypes.map((sub) => {
              const isSelected = activeSubTypeId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Filter drinks by ${sub.title}`}
                  onClick={() => {
                    setActiveMenuId('menu_drinks');
                    setActiveSubTypeId(sub.id);
                  }}
                  className={cn(
                    'inline-flex items-center min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                    isSelected
                      ? 'bg-[#F8E850]/20 text-[#F8E010] border border-[#F8E010]'
                      : 'bg-[#101010] text-[#E6E6E6] border border-white/10 hover:border-[#F8E010]/40'
                  )}
                >
                  {sub.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty Search / Filter State */}
      {totalMatchingCount === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#161616] p-12 text-center space-y-4">
          <h2 className="font-display text-3xl text-[#F8E010]">
            NO MENU ITEMS MATCH YOUR FILTER
          </h2>
          <p className="text-sm text-[#E6E6E6] max-w-md mx-auto">
            Try clearing your search query or switching back to All Menus to
            browse all {catalog.menuItems.length} dishes.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveMenuId('all');
              setActiveSubTypeId('all');
              setSpicyOnly(false);
              setSearchInput('');
            }}
            className="inline-flex items-center justify-center min-h-[44px] rounded-xl bg-[#F8E010] px-6 py-2.5 text-sm font-bold text-[#101010] hover:bg-[#F8E850] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            Show All Dishes
          </button>
        </div>
      )}

      {/* Menu Sections with alternating .gb-stage background stains */}
      <div className="space-y-12">
        {visibleMenus.map((menu, menuIdx) => {
          const itemsForMenu = menu.itemId
            .map((id) => lookup.itemsById.get(id))
            .filter((item): item is MenuItem => Boolean(item))
            .filter(filterItem);

          if (itemsForMenu.length === 0) return null;

          const stainPos = menuIdx % 2 === 0 ? 'top-left' : 'top-right';
          const isLongSection = itemsForMenu.length >= 9;

          return (
            <StageSection
              key={menu.id}
              id={menu.id}
              stain={stainPos}
              includeBottomLeftStain={isLongSection}
              className="rounded-3xl border border-white/10 bg-[#101010]/60 p-5 sm:p-8 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#E6E6E6]/70">
                    Gee&apos;s Burger Menu
                  </p>
                  <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010]">
                    {menu.title}
                  </h2>
                </div>
                <span className="text-xs text-[#E6E6E6]/80 tabular-nums">
                  {itemsForMenu.length}{' '}
                  {itemsForMenu.length === 1 ? 'dish' : 'dishes'}
                </span>
              </div>

              {/* Informational Combo Banner on Sliders (x2) */}
              {menu.id === 'menu_sliders_x2' && (
                <ComboBanner comboAddOn={comboAddOn} />
              )}

              {/* Drinks Grouped by 4 Sub-Types */}
              {menu.id === 'menu_drinks' ? (
                <div className="space-y-10">
                  {drinkSubTypes.map((subType) => {
                    const subItems = itemsForMenu.filter(
                      (i) => i.subTypeId === subType.id
                    );
                    if (subItems.length === 0) return null;

                    return (
                      <div key={subType.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h3 className="font-display text-2xl sm:text-3xl text-[#F8E010]">
                            {subType.title}
                          </h3>
                          <span className="text-xs text-[#E6E6E6]/70 tabular-nums">
                            {subItems.length} options
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {subItems.map((item) => {
                            const variants =
                              lookup.variantsByItemId.get(item.id) ?? [];
                            const addOns = item.addOnId
                              .map((id) => lookup.addOnsById.get(id))
                              .filter((a): a is NonNullable<typeof a> =>
                                Boolean(a)
                              );
                            return (
                              <MenuItemCard
                                key={item.id}
                                item={item}
                                variants={variants}
                                addOns={addOns}
                                menuTitle={`${menu.title} · ${subType.title}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsForMenu.map((item) => {
                    const variants = lookup.variantsByItemId.get(item.id) ?? [];
                    const addOns = item.addOnId
                      .map((id) => lookup.addOnsById.get(id))
                      .filter((a): a is NonNullable<typeof a> => Boolean(a));

                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        variants={variants}
                        addOns={addOns}
                        menuTitle={menu.title}
                      />
                    );
                  })}
                </div>
              )}
            </StageSection>
          );
        })}
      </div>
    </div>
  );
}
