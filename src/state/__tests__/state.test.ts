import { describe, expect, it } from 'vitest';
import { catalogIndex } from '@/lib/catalog-index';
import { formatNaira } from '@/lib/money';
import { actions } from '@/state/actions';
import {
  findCatalogConflictsForCartLines,
  parseCrossTabCartStorage,
  validateCartLinesAgainstCatalog,
} from '@/state/context';
import { buildRestaurantJsonLd } from '@/lib/seo';
import {
  initialAlertsState,
  initialCartState,
  initialCatalogFilterState,
  initialState,
} from '@/state/initialState';
import { rootReducer } from '@/state/reducer';
import {
  buildLineKey,
  normalizeForSearch,
  selectCartCount,
  selectCartTotal,
  selectLineTotal,
  selectVisibleMenus,
} from '@/state/selectors';
import { deriveMenuCardLayout } from '@/hooks/useMenuCardModel';
import {
  deriveMenuAddOnsBannerText,
  deriveSliderComboBannerText,
} from '@/components/menu/combo-banner';
import { siteConfig } from '@/config/site';
import { deriveStockConflictMessage } from '@/components/cart/StockConflictBanner';
import {
  executeAlertAction,
  registerRetrySubmitHandler,
} from '@/lib/alert-action-registry';
import { alertEvents } from '@/lib/alert-events';
import {
  buildWhatsAppMessage,
  MAX_WHATSAPP_MESSAGE_LENGTH,
} from '@/lib/whatsapp';
import {
  checkoutSchema,
  isValidNigerianPhone,
  normalizeNigerianPhone,
} from '@/schemas/checkout.schema';
import { validatedCatalog } from '@/lib/catalog-index';
import deliveryAreasData from '@/data/delivery-areas.json';
import type { DeliveryArea } from '@/lib/api/types';
import { alertsReducer } from '@/state/slices/alerts.reducer';
import { cartReducer } from '@/state/slices/cart.reducer';
import { catalogReducer } from '@/state/slices/catalog.reducer';

describe('Stage 2: Domain State, Reducers & Selectors', () => {
  describe('Cart reducer rules', () => {
    it('constructs line identity key = itemId + ":" + (variantId ?? "-")', () => {
      expect(
        buildLineKey('item_gee_s_fried_chicken_fried_chicken', 'var_gee_s_fried_chicken_fried_chicken_2_pcs')
      ).toBe(
        'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs'
      );
      expect(buildLineKey('item_sliders_x2_original_beef', null)).toBe(
        'item_sliders_x2_original_beef:-'
      );
    });

    it('merges lines with the same key: adds qty and adds add-on quantities per addOnId independently', () => {
      const s1 = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId: 'item_gee_s_fried_chicken_fried_chicken',
          variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
          qty: 1,
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 2 }],
        })
      );

      expect(s1.lines).toHaveLength(1);
      expect(s1.lines[0]).toEqual({
        key: 'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
        itemId: 'item_gee_s_fried_chicken_fried_chicken',
        variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
        qty: 1,
        addOns: [{ addOnId: 'addon_side_of_rice', qty: 2 }],
      });

      const s2 = cartReducer(
        s1,
        actions.cartAddLine({
          itemId: 'item_gee_s_fried_chicken_fried_chicken',
          variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
          qty: 2,
          addOns: [
            { addOnId: 'addon_side_of_rice', qty: 2 },
            { addOnId: 'addon_fries_and_drink', qty: 1 },
          ],
        })
      );

      expect(s2.lines).toHaveLength(1);
      expect(s2.lines[0]?.qty).toBe(3);
      expect(s2.lines[0]?.addOns).toEqual([
        { addOnId: 'addon_side_of_rice', qty: 4 },
        { addOnId: 'addon_fries_and_drink', qty: 1 },
      ]);
    });

    it('clamps both item qty and add-on qty to [1, 50] and never rejects', () => {
      const s1 = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId: 'item_sliders_x2_original_beef',
          variantId: null,
          qty: 999,
          addOns: [{ addOnId: 'addon_slider_combo', qty: 120 }],
        })
      );

      expect(s1.lines[0]?.qty).toBe(50);
      expect(s1.lines[0]?.addOns[0]?.qty).toBe(50);

      // Merging more onto a line already at 50 stays clamped at 50
      const s2 = cartReducer(
        s1,
        actions.cartAddLine({
          itemId: 'item_sliders_x2_original_beef',
          variantId: null,
          qty: 10,
          addOns: [{ addOnId: 'addon_slider_combo', qty: 5 }],
        })
      );
      expect(s2.lines[0]?.qty).toBe(50);
      expect(s2.lines[0]?.addOns[0]?.qty).toBe(50);

      // setQty clamps > 50 to 50
      const s3 = cartReducer(
        s2,
        actions.cartSetQty({
          key: 'item_sliders_x2_original_beef:-',
          qty: 75,
        })
      );
      expect(s3.lines[0]?.qty).toBe(50);

      // setAddOnQty clamps > 50 to 50
      const s4 = cartReducer(
        s3,
        actions.cartSetAddOnQty({
          key: 'item_sliders_x2_original_beef:-',
          addOnId: 'addon_slider_combo',
          qty: 88,
        })
      );
      expect(s4.lines[0]?.addOns[0]?.qty).toBe(50);
    });

    it('removes line (and its conflict) when setQty <= 0, and removes add-on when setAddOnQty <= 0', () => {
      const key = 'item_sliders_x2_original_beef:-';
      let state = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId: 'item_sliders_x2_original_beef',
          variantId: null,
          qty: 2,
          addOns: [
            { addOnId: 'addon_slider_combo', qty: 2 },
            { addOnId: 'addon_cheese_sauce', qty: 1 },
          ],
        })
      );
      state = cartReducer(
        state,
        actions.cartSetConflicts({
          conflicts: { [key]: 'Out of stock warning' },
        })
      );

      // setAddOnQty to 0 removes only that add-on
      state = cartReducer(
        state,
        actions.cartSetAddOnQty({
          key,
          addOnId: 'addon_slider_combo',
          qty: 0,
        })
      );
      expect(state.lines[0]?.addOns).toEqual([
        { addOnId: 'addon_cheese_sauce', qty: 1 },
      ]);

      // removeAddOn removes remaining add-on
      state = cartReducer(
        state,
        actions.cartRemoveAddOn({
          key,
          addOnId: 'addon_cheese_sauce',
        })
      );
      expect(state.lines[0]?.addOns).toEqual([]);

      // setQty to 0 removes the line and clears its conflict
      state = cartReducer(state, actions.cartSetQty({ key, qty: 0 }));
      expect(state.lines).toHaveLength(0);
      expect(state.conflicts[key]).toBeUndefined();
    });

    it('removeLine clears its conflict, and clear empties both lines and conflicts', () => {
      const keyA = 'item_sliders_x2_original_beef:-';
      const keyB = 'item_dips_garlic:-';
      let state = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId: 'item_sliders_x2_original_beef',
          variantId: null,
          qty: 1,
        })
      );
      state = cartReducer(
        state,
        actions.cartAddLine({
          itemId: 'item_dips_garlic',
          variantId: null,
          qty: 2,
        })
      );
      state = cartReducer(
        state,
        actions.cartSetConflicts({
          conflicts: {
            [keyA]: 'Conflict A',
            [keyB]: 'Conflict B',
          },
        })
      );

      state = cartReducer(state, actions.cartRemoveLine({ key: keyA }));
      expect(state.lines).toHaveLength(1);
      expect(state.conflicts[keyA]).toBeUndefined();
      expect(state.conflicts[keyB]).toBe('Conflict B');

      state = cartReducer(state, actions.cartClear());
      expect(state.lines).toEqual([]);
      expect(state.conflicts).toEqual({});
    });

    it('setVariant re-keys a line and merges if the target variant line already exists', () => {
      const itemId = 'item_gee_s_fried_chicken_fried_chicken';
      const v2 = 'var_gee_s_fried_chicken_fried_chicken_2_pcs';
      const v4 = 'var_gee_s_fried_chicken_fried_chicken_4_pcs';

      let state = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId,
          variantId: v2,
          qty: 2,
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 1 }],
        })
      );
      state = cartReducer(
        state,
        actions.cartAddLine({
          itemId,
          variantId: v4,
          qty: 3,
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 2 }],
        })
      );

      // Change v2 line to v4 -> merges with existing v4 line
      state = cartReducer(
        state,
        actions.cartSetVariant({
          key: buildLineKey(itemId, v2),
          variantId: v4,
        })
      );

      expect(state.lines).toHaveLength(1);
      expect(state.lines[0]?.key).toBe(buildLineKey(itemId, v4));
      expect(state.lines[0]?.qty).toBe(5);
      expect(state.lines[0]?.addOns).toEqual([
        { addOnId: 'addon_side_of_rice', qty: 3 },
      ]);
    });

    it('cart/hydrate replaces lines with validated list and marks isHydrated = true', () => {
      const rawLines = [
        {
          key: 'item_sliders_x2_original_beef:-',
          itemId: 'item_sliders_x2_original_beef',
          variantId: null,
          qty: 2,
          addOns: [{ addOnId: 'addon_combo_upgrade', qty: 2 }],
        },
        {
          key: 'item_non_existent:-',
          itemId: 'item_non_existent',
          variantId: null,
          qty: 1,
          addOns: [],
        },
      ];

      const { validLines, droppedCount } =
        validateCartLinesAgainstCatalog(rawLines);
      expect(droppedCount).toBe(1);
      expect(validLines).toHaveLength(1);

      const hydrated = cartReducer(
        initialCartState,
        actions.cartHydrate({ lines: validLines })
      );
      expect(hydrated.isHydrated).toBe(true);
      expect(hydrated.lines).toEqual(validLines);
    });
  });

  describe('Demo calculation & cart selectors', () => {
    it('computes 3 × Fried Chicken (2 pcs) + 4 × Side of Rice = ₦38,000 (38000)', () => {
      // 3 × 2 pcs Fried Chicken (3 × 6000 = 18000) + 4 × Side of Rice (4 × 5000 = 20000) = 38000
      const state = cartReducer(
        initialCartState,
        actions.cartAddLine({
          itemId: 'item_gee_s_fried_chicken_fried_chicken',
          variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
          qty: 3,
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
        })
      );

      expect(state.lines).toHaveLength(1);
      const lineTotal = selectLineTotal(state.lines[0]!, catalogIndex);
      expect(lineTotal).toBe(38000);

      const cartTotal = selectCartTotal(state, catalogIndex);
      expect(cartTotal).toBe(38000);
      expect(formatNaira(cartTotal)).toBe('₦38,000');
      expect(selectCartCount(state)).toBe(3);
    });
  });

  describe('Catalog filter reducer & selectVisibleMenus', () => {
    it('search/setMenu clears subTypeId, subTypeId is only valid while its menu is selected, and search/reset clears all three', () => {
      let filter = catalogReducer(
        initialCatalogFilterState,
        actions.searchSetQuery({ query: 'burger' })
      );
      filter = catalogReducer(
        filter,
        actions.searchSetMenu({ menuId: 'menu_drinks' })
      );
      filter = catalogReducer(
        filter,
        actions.searchSetSubType({ subTypeId: 'sub_drinks_milkshakes' })
      );

      expect(filter).toEqual({
        query: 'burger',
        menuId: 'menu_drinks',
        subTypeId: 'sub_drinks_milkshakes',
      });

      // Switching menu clears subTypeId
      filter = catalogReducer(
        filter,
        actions.searchSetMenu({ menuId: 'menu_beef_burgers' })
      );
      expect(filter.menuId).toBe('menu_beef_burgers');
      expect(filter.subTypeId).toBeNull();

      // Setting a subType that belongs to menu_drinks while menu_beef_burgers is selected is ignored
      const invalidSubTypeAttempt = catalogReducer(
        filter,
        actions.searchSetSubType({ subTypeId: 'sub_drinks_milkshakes' })
      );
      expect(invalidSubTypeAttempt.subTypeId).toBeNull();

      // Reset clears all three
      const resetState = catalogReducer(filter, actions.searchReset());
      expect(resetState).toEqual({
        query: '',
        menuId: null,
        subTypeId: null,
      });
    });

    it('matches "jalapeno" case- and diacritic-insensitively on item name ("Jalapeño") and composition', () => {
      expect(normalizeForSearch('Jalapeño')).toBe('jalapeno');

      const visibleMenus = selectVisibleMenus(
        { query: 'jalapeno', menuId: null, subTypeId: null },
        catalogIndex
      );

      // Should omit empty menus and include Menus with matching items
      expect(visibleMenus.length).toBeGreaterThan(0);
      expect(visibleMenus.every((g) => g.items.length > 0)).toBe(true);

      const allMatchedItemIds = visibleMenus.flatMap((g) =>
        g.items.map((i) => i.id)
      );
      // "Jalapeño" dip item name match
      expect(allMatchedItemIds).toContain('item_dips_jalape_o');
      // Items whose composition mentions jalapeños
      expect(allMatchedItemIds).toContain('item_sliders_x2_honey_mustard_chicken');
      expect(allMatchedItemIds).toContain('item_sandwiches_steak_sandwich');
    });

    it('groups Drinks menu items by sub-type in selectVisibleMenus', () => {
      const visibleDrinks = selectVisibleMenus(
        { query: '', menuId: 'menu_drinks', subTypeId: null },
        catalogIndex
      );

      expect(visibleDrinks).toHaveLength(1);
      const drinksGroup = visibleDrinks[0]!;
      expect(drinksGroup.menu.id).toBe('menu_drinks');
      expect(drinksGroup.subTypeGroups).not.toBeNull();
      expect(drinksGroup.subTypeGroups?.length).toBe(4);
    });
  });

  describe('Alerts reducer rules (max 3 cap & dedupeKey)', () => {
    it('caps alert queue at 3 (dropping oldest) and de-duplicates by dedupeKey (replacing and refreshing)', () => {
      let state = alertsReducer(
        initialAlertsState,
        actions.alertsPush({
          id: 'a1',
          severity: 'info',
          message: 'First',
          dedupeKey: 'key-1',
          createdAt: 1000,
        })
      );
      state = alertsReducer(
        state,
        actions.alertsPush({
          id: 'a2',
          severity: 'success',
          message: 'Second',
          dedupeKey: 'key-2',
          createdAt: 2000,
        })
      );
      state = alertsReducer(
        state,
        actions.alertsPush({
          id: 'a3',
          severity: 'warning',
          message: 'Third',
          dedupeKey: 'key-3',
          createdAt: 3000,
        })
      );

      expect(state.queue.map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);

      // Re-pushing key-1 replaces a1 and refreshes it to the end of the queue
      state = alertsReducer(
        state,
        actions.alertsPush({
          id: 'a1-refreshed',
          severity: 'info',
          message: 'First Refreshed',
          dedupeKey: 'key-1',
          createdAt: 4000,
        })
      );
      expect(state.queue.map((a) => a.id)).toEqual([
        'a2',
        'a3',
        'a1-refreshed',
      ]);

      // Pushing a 4th distinct alert drops the oldest ('a2')
      state = alertsReducer(
        state,
        actions.alertsPush({
          id: 'a4',
          severity: 'error',
          message: 'Fourth',
          dedupeKey: 'key-4',
          createdAt: 5000,
        })
      );
      expect(state.queue).toHaveLength(3);
      expect(state.queue.map((a) => a.id)).toEqual([
        'a3',
        'a1-refreshed',
        'a4',
      ]);

      // Dismissing an alert removes it by id
      state = alertsReducer(state, actions.alertsDismiss({ id: 'a3' }));
      expect(state.queue.map((a) => a.id)).toEqual(['a1-refreshed', 'a4']);

      // Clearing empties queue
      state = alertsReducer(state, actions.alertsClear());
      expect(state.queue).toEqual([]);
    });

    it('rootReducer dispatches across all slices cleanly', () => {
      const next = rootReducer(
        initialState,
        actions.cartAddLine({
          itemId: 'item_gee_s_fried_chicken_fried_chicken',
          variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
          qty: 3,
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
        })
      );
      expect(selectCartTotal(next, catalogIndex)).toBe(38000);
    });
  });

  describe('Stage 3: MenuCard layout derivation from catalog data', () => {
    const getLayoutForItemId = (id: string) => {
      const item = catalogIndex.itemsById.get(id)!;
      const variants = catalogIndex.variantsByItemId.get(id) ?? [];
      const addOns = item.addOnId
        .map((aId) => catalogIndex.addOnsById.get(aId))
        .filter(Boolean);
      return deriveMenuCardLayout({
        hasComposition: Boolean(item.composition && item.composition.trim()),
        hasVariants: variants.length > 0,
        hasAddOns: addOns.length > 0,
      });
    };

    it('derives layouts A, B, C, D, E strictly from catalog data', () => {
      expect(
        getLayoutForItemId('item_gee_s_fried_chicken_fried_chicken')
      ).toBe('A');
      expect(getLayoutForItemId('item_dessert_waffle')).toBe('B');
      expect(getLayoutForItemId('item_dessert_ice_cream')).toBe('B');
      expect(getLayoutForItemId('item_mains_chicken_biryani')).toBe('E');
      expect(getLayoutForItemId('item_sliders_x2_original_beef')).toBe('E');
      expect(
        getLayoutForItemId('item_starters_buffalo_chicken_wings')
      ).toBe('D');
      expect(getLayoutForItemId('item_drinks_water')).toBe('C');
    });
  });

  describe('Stage 4: Home featured items, Menu banners & sub-type filtering', () => {
    it('resolves all 5 featuredItemIds from siteConfig against catalogIndex', () => {
      expect(siteConfig.featuredItemIds).toHaveLength(5);
      for (const id of siteConfig.featuredItemIds) {
        expect(catalogIndex.itemsById.has(id)).toBe(true);
      }
    });

    it('derives Sliders and Fried Chicken banner text strictly from add-on records', () => {
      const comboAddOn = catalogIndex.addOnsById.get('addon_combo_upgrade');
      expect(deriveSliderComboBannerText(comboAddOn)).toBe(
        'Upgrade to a Combo, Fries & Drink, for ₦5,500'
      );

      const friesAddOn = catalogIndex.addOnsById.get('addon_side_of_fries')!;
      const riceAddOn = catalogIndex.addOnsById.get('addon_side_of_rice')!;
      expect(deriveMenuAddOnsBannerText([friesAddOn, riceAddOn])).toBe(
        '+ Side of Fries ₦5,000 · + Side of Rice ₦5,000'
      );
    });

    it('filters Drinks -> Milkshakes and Drinks -> Mocktails cleanly', () => {
      const milkshakesOnly = selectVisibleMenus(
        {
          query: '',
          menuId: 'menu_drinks',
          subTypeId: 'sub_drinks_milkshakes',
        },
        catalogIndex
      );
      expect(milkshakesOnly).toHaveLength(1);
      expect(
        milkshakesOnly[0]!.items.every(
          (i) => i.subTypeId === 'sub_drinks_milkshakes'
        )
      ).toBe(true);

      const mocktailsOnly = selectVisibleMenus(
        {
          query: '',
          menuId: 'menu_drinks',
          subTypeId: 'sub_drinks_mocktails',
        },
        catalogIndex
      );
      expect(mocktailsOnly).toHaveLength(1);
      expect(
        mocktailsOnly[0]!.items.every(
          (i) => i.subTypeId === 'sub_drinks_mocktails'
        )
      ).toBe(true);
    });
  });

  describe('Stage 5.1: StockConflictBanner & shared buildWhatsAppMessage', () => {
    it('derives StockConflictBanner message strictly from catalog item and variant', () => {
      const msg = deriveStockConflictMessage(
        'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_8_pcs',
        'Fallback'
      );
      expect(msg).toBe(
        'Fried Chicken (8 pcs) is no longer available. Choose another option or remove it.'
      );
    });

    it('builds identical WhatsApp message for preview and order creation', () => {
      const areas = deliveryAreasData as DeliveryArea[];
      const result = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'GB-TEST01',
        createdAt: '2026-11-04T00:00:00.000Z',
        customerName: 'Amina Musa',
        customerPhone: '08031234567',
        homeAddress: 'No. 10 Zoo Road, Kano',
        fulfillment: 'delivery',
        deliveryAreaId: 'area_bompai',
        transportMode: 'bike',
        address: 'Plot 5 Bompai Road',
        exactAddress: 'Plot 5 Bompai Road, near central mosque',
        lines: [
          {
            lineId:
              'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
            itemId: 'item_gee_s_fried_chicken_fried_chicken',
            variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
            addOnIds: ['addon_side_of_rice'],
            addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
            quantity: 1,
          },
        ],
      });

      expect(result.subtotal).toBe(26000);
      expect(result.deliveryFee).toBe(500);
      expect(result.total).toBe(26500);
      expect(result.messagePreview).toBe(
        'Hello admin, my name is Amina Musa, I ordered 1 × Fried Chicken (2 pcs) + 4 × Side of Rice; Delivery to Bompai by Bike (₦500). Total amount: ₦26,500. Kindly send your account number for order payment. Order ref: GB-TEST01.'
      );
    });
  });

  describe('Stage 5.2: Serialisable Alert Event Catalog & Action Registry', () => {
    it('constructs all 8 canonical alert events with serialisable payloads and exact copy', () => {
      const added = alertEvents.itemAdded({
        lineKey:
          'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
        qty: 3,
        itemName: 'Fried Chicken',
        variantLabel: '2 pcs',
      });
      expect(added).toEqual({
        severity: 'success',
        title: 'Added to cart',
        message: '3 × Fried Chicken (2 pcs)',
        dedupeKey:
          'added:item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
      });

      expect(alertEvents.cartRestored()).toEqual({
        severity: 'info',
        title: 'Welcome back',
        message: 'We restored your cart.',
        dedupeKey: 'restored',
      });

      expect(alertEvents.itemsDroppedOnHydrate()).toEqual({
        severity: 'warning',
        title: 'Cart updated',
        message: 'Some items are no longer available and were removed.',
        dedupeKey: 'hydrate-dropped',
      });

      expect(alertEvents.submitConflict()).toEqual({
        severity: 'warning',
        title: 'Some items changed',
        message: 'Please review the highlighted items.',
        dedupeKey: 'conflict',
        action: {
          label: 'Review cart',
          kind: 'reviewCart',
        },
      });

      expect(alertEvents.pricesChanged()).toEqual({
        severity: 'warning',
        title: 'Prices updated',
        message: 'Please review your new total.',
        dedupeKey: 'price-changed',
      });

      expect(alertEvents.submitNetworkFailure()).toEqual({
        severity: 'error',
        sticky: true,
        title: 'Network disconnected',
        message:
          "We couldn't send your order. Check your connection and try again.",
        dedupeKey: 'submit-network',
        action: {
          label: 'Retry',
          kind: 'retrySubmit',
        },
      });

      expect(alertEvents.rateLimited()).toEqual({
        severity: 'warning',
        title: 'Too many attempts',
        message: 'Please wait a moment and try again.',
        dedupeKey: 'rate-limit',
      });

      expect(alertEvents.orderCreated()).toEqual({
        severity: 'success',
        title: 'Order sent',
        message: 'Opening WhatsApp…',
        dedupeKey: 'order-sent',
      });
    });

    it('maps retrySubmit action.kind to the registered useSubmitOrder().retry handler', () => {
      let retriedCount = 0;
      const unregister = registerRetrySubmitHandler(() => {
        retriedCount += 1;
      });

      executeAlertAction({ label: 'Retry', kind: 'retrySubmit' });
      expect(retriedCount).toBe(1);

      unregister();
    });
  });

  describe('Stage 5.3: Real catalog pricing for the screenshot demo order', () => {
    it('computes ₦55,000 (not ₦52,000) for 3× Fried Chicken (2 pcs) + 4× Side of Rice + 1× Classic Beef Burger (₦10,000) + 1× Oreo (₦6,500) + Bompai Bike (₦500)', () => {
      const areas = deliveryAreasData as DeliveryArea[];
      const result = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'GB-DEMO55',
        createdAt: '2026-11-04T00:00:00.000Z',
        customerName: 'Ibrahim Sani',
        customerPhone: '08031234567',
        homeAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        fulfillment: 'delivery',
        deliveryAreaId: 'area_bompai',
        transportMode: 'bike',
        address: 'No. 14 Sultan Road, Nassarawa GRA',
        exactAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        lines: [
          {
            lineId:
              'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
            itemId: 'item_gee_s_fried_chicken_fried_chicken',
            variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
            addOnIds: ['addon_side_of_rice'],
            addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
            quantity: 3,
          },
          {
            lineId: 'item_burgers_classic_beef_burger:-',
            itemId: 'item_burgers_classic_beef_burger',
            variantId: null,
            addOnIds: [],
            addOns: [],
            quantity: 1,
          },
          {
            lineId: 'item_drinks_oreo:-',
            itemId: 'item_drinks_oreo',
            variantId: null,
            addOnIds: [],
            addOns: [],
            quantity: 1,
          },
        ],
      });

      // 38,000 + 10,000 + 6,500 = 54,500 subtotal + 500 Bike fee = 55,000 total
      expect(result.subtotal).toBe(54500);
      expect(result.deliveryFee).toBe(500);
      expect(result.total).toBe(55000);
      expect(formatNaira(result.total)).toBe('₦55,000');
      expect(result.messagePreview).toBe(
        'Hello admin, my name is Ibrahim Sani, I ordered 3 × Fried Chicken (2 pcs) + 4 × Side of Rice; 1 × Classic Beef Burger; 1 × Oreo; Delivery to Bompai by Bike (₦500). Total amount: ₦55,000. Kindly send your account number for order payment. Order ref: GB-DEMO55.'
      );
    });
  });

  describe('Stage 5.4: Checkout discriminatedUnion schema, phone normalisation & WhatsApp 1800-char cap', () => {
    it('validates and normalises Nigerian mobile numbers to 234...', () => {
      expect(isValidNigerianPhone('0803 123 4567')).toBe(true);
      expect(isValidNigerianPhone('+234-803-123-4567')).toBe(true);
      expect(isValidNigerianPhone('2347012345678')).toBe(true);
      expect(isValidNigerianPhone('06031234567')).toBe(false);

      expect(normalizeNigerianPhone('0803 123 4567')).toBe('2348031234567');
      expect(normalizeNigerianPhone('+234-803-123-4567')).toBe('2348031234567');
    });

    it('validates pickup and delivery payloads via checkoutSchema discriminatedUnion', () => {
      const pickupParsed = checkoutSchema.safeParse({
        deliveryType: 'pickup',
        fullName: '  Zainab Bello  ',
        phone: '0803 111 2222',
        homeAddress: 'No. 8 Nasarawa GRA, Kano',
      });
      expect(pickupParsed.success).toBe(true);
      if (pickupParsed.success) {
        expect(pickupParsed.data.fullName).toBe('Zainab Bello');
        expect(pickupParsed.data.phone).toBe('2348031112222');
      }

      const invalidDelivery = checkoutSchema.safeParse({
        deliveryType: 'delivery',
        fullName: 'Zainab Bello',
        phone: '0803 111 2222',
        homeAddress: 'No. 8 Nasarawa GRA, Kano',
        deliveryAreaId: '',
        vehicle: 'bike',
        exactAddress: '123',
      });
      expect(invalidDelivery.success).toBe(false);
    });

    it('shows Order ref: (assigned on send) in preview before order exists and collapses >1800 char messages', () => {
      const areas = deliveryAreasData as DeliveryArea[];
      const preview = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'PREVIEW',
        createdAt: '',
        customerName: 'Amina Musa',
        customerPhone: '08031234567',
        fulfillment: 'pickup',
        deliveryAreaId: null,
        transportMode: null,
        address: 'No. 10 Zoo Road, Kano',
        lines: [
          {
            lineId: 'item_burgers_classic_beef_burger:-',
            itemId: 'item_burgers_classic_beef_burger',
            variantId: null,
            addOnIds: [],
            quantity: 2,
          },
        ],
      });
      expect(preview.messagePreview).toContain('Order ref: (assigned on send).');

      // Build an order with 60 lines to exceed 1,800 characters
      const manyLines = Array.from({ length: 60 }, (_, idx) => ({
        lineId: `line-${idx}`,
        itemId: 'item_gee_s_fried_chicken_fried_chicken',
        variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
        addOnIds: ['addon_side_of_rice', 'addon_side_of_fries'],
        addOns: [
          { addOnId: 'addon_side_of_rice', qty: 2 },
          { addOnId: 'addon_side_of_fries', qty: 2 },
        ],
        quantity: 2,
      }));

      const capped = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'GB-LONG99',
        createdAt: '',
        customerName: 'Amina Musa',
        customerPhone: '08031234567',
        fulfillment: 'delivery',
        deliveryAreaId: 'area_bompai',
        transportMode: 'car',
        address: 'Plot 5 Bompai Road',
        lines: manyLines,
      });

      expect(capped.fullMessage.length).toBeGreaterThan(MAX_WHATSAPP_MESSAGE_LENGTH);
      expect(capped.messagePreview.length).toBeLessThanOrEqual(
        MAX_WHATSAPP_MESSAGE_LENGTH
      );
      expect(capped.messagePreview).toMatch(/… and \d+ more items/);
      expect(capped.messagePreview).toContain('Order ref: GB-LONG99.');
    });
  });

  describe('Stage 5.5: Acceptance checks', () => {
    it('starts with no toasts and no stock conflict banners by default', () => {
      expect(initialState.alerts.queue).toHaveLength(0);
      expect(Object.keys(initialState.cart.conflicts)).toHaveLength(0);
    });

    it('computes pickup total = ₦54,500 and delivery to Bompai by bike = ₦55,000, with preview matching sent message', () => {
      const areas = deliveryAreasData as DeliveryArea[];
      const demoLines = [
        {
          lineId:
            'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_2_pcs',
          itemId: 'item_gee_s_fried_chicken_fried_chicken',
          variantId: 'var_gee_s_fried_chicken_fried_chicken_2_pcs',
          addOnIds: ['addon_side_of_rice'],
          addOns: [{ addOnId: 'addon_side_of_rice', qty: 4 }],
          quantity: 3,
        },
        {
          lineId: 'item_burgers_classic_beef_burger:-',
          itemId: 'item_burgers_classic_beef_burger',
          variantId: null,
          addOnIds: [],
          addOns: [],
          quantity: 1,
        },
        {
          lineId: 'item_drinks_oreo:-',
          itemId: 'item_drinks_oreo',
          variantId: null,
          addOnIds: [],
          addOns: [],
          quantity: 1,
        },
      ];

      const pickupBuilt = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'GB-ACCEPT1',
        createdAt: '2026-11-04T00:00:00.000Z',
        customerName: 'Ibrahim Sani',
        customerPhone: '2348031234567',
        homeAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        fulfillment: 'pickup',
        deliveryAreaId: null,
        transportMode: null,
        address: 'No. 14 Sultan Road, Nassarawa GRA',
        lines: demoLines,
      });

      expect(pickupBuilt.subtotal).toBe(54500);
      expect(pickupBuilt.deliveryFee).toBe(0);
      expect(pickupBuilt.total).toBe(54500);
      expect(formatNaira(pickupBuilt.total)).toBe('₦54,500');

      const deliveryPreview = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'PREVIEW',
        createdAt: '2026-11-04T00:00:00.000Z',
        customerName: 'Ibrahim Sani',
        customerPhone: '2348031234567',
        homeAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        fulfillment: 'delivery',
        deliveryAreaId: 'area_bompai',
        transportMode: 'bike',
        address: 'No. 14 Sultan Road, Nassarawa GRA',
        exactAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        lines: demoLines,
      });

      const deliverySent = buildWhatsAppMessage(validatedCatalog, areas, {
        orderId: 'GB-ACCEPT2',
        createdAt: '2026-11-04T00:00:00.000Z',
        customerName: 'Ibrahim Sani',
        customerPhone: '2348031234567',
        homeAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        fulfillment: 'delivery',
        deliveryAreaId: 'area_bompai',
        transportMode: 'bike',
        address: 'No. 14 Sultan Road, Nassarawa GRA',
        exactAddress: 'No. 14 Sultan Road, Nassarawa GRA',
        lines: demoLines,
      });

      expect(deliverySent.subtotal).toBe(54500);
      expect(deliverySent.deliveryFee).toBe(500);
      expect(deliverySent.total).toBe(55000);
      expect(formatNaira(deliverySent.total)).toBe('₦55,000');

      // Preview text matches sent message except for the assigned orderId placeholder
      expect(
        deliveryPreview.messagePreview.replace(
          'Order ref: (assigned on send).',
          'Order ref: GB-ACCEPT2.'
        )
      ).toBe(deliverySent.messagePreview);
    });
  });

  describe('Stage 6: Hardening & SEO checks', () => {
    it('syncs cross-tab storage clear and updates via parseCrossTabCartStorage', () => {
      expect(parseCrossTabCartStorage(null, catalogIndex)).toEqual({
        kind: 'clear',
      });
      expect(
        parseCrossTabCartStorage(
          JSON.stringify({ version: 1, lines: [] }),
          catalogIndex
        )
      ).toEqual({
        kind: 'clear',
      });

      const validPayload = JSON.stringify({
        version: 1,
        lines: [
          {
            key: 'item_burgers_classic_beef_burger:-',
            itemId: 'item_burgers_classic_beef_burger',
            variantId: null,
            qty: 2,
            addOns: [],
          },
        ],
      });
      const hydrated = parseCrossTabCartStorage(validPayload, catalogIndex);
      expect(hydrated.kind).toBe('hydrate');
      if (hydrated.kind === 'hydrate') {
        expect(hydrated.lines).toHaveLength(1);
        expect(hydrated.lines[0].qty).toBe(2);
      }
    });

    it('detects when an item or variant becomes stock_out while in the cart', () => {
      const variantsWithSoldOut4Pcs = new Map(catalogIndex.variantsById);
      const fourPcs = variantsWithSoldOut4Pcs.get(
        'var_gee_s_fried_chicken_fried_chicken_4_pcs'
      );
      if (fourPcs) {
        variantsWithSoldOut4Pcs.set(fourPcs.id, {
          ...fourPcs,
          status: 'stock_out',
        });
      }

      const simulatedIndex = {
        ...catalogIndex,
        variantsById: variantsWithSoldOut4Pcs,
      };

      const conflicts = findCatalogConflictsForCartLines(
        [
          {
            key: 'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_4_pcs',
            itemId: 'item_gee_s_fried_chicken_fried_chicken',
            variantId: 'var_gee_s_fried_chicken_fried_chicken_4_pcs',
            qty: 1,
            addOns: [],
          },
          {
            key: 'item_burgers_classic_beef_burger:-',
            itemId: 'item_burgers_classic_beef_burger',
            variantId: null,
            qty: 1,
            addOns: [],
          },
        ],
        simulatedIndex
      );

      expect(
        conflicts[
          'item_gee_s_fried_chicken_fried_chicken:var_gee_s_fried_chicken_fried_chicken_4_pcs'
        ]
      ).toBe(
        'Fried Chicken (4 pcs) is no longer available. Choose another option or remove it.'
      );
      expect(conflicts['item_burgers_classic_beef_burger:-']).toBeUndefined();
    });

    it('rejects very long names (>80 chars) and addresses (>200 chars) in checkoutSchema', () => {
      const tooLongName = checkoutSchema.safeParse({
        deliveryType: 'pickup',
        fullName: 'A'.repeat(81),
        phone: '08031234567',
        homeAddress: 'No. 14 Sultan Road, Kano',
      });
      expect(tooLongName.success).toBe(false);

      const tooLongAddress = checkoutSchema.safeParse({
        deliveryType: 'pickup',
        fullName: 'Ibrahim Sani',
        phone: '08031234567',
        homeAddress: 'B'.repeat(201),
      });
      expect(tooLongAddress.success).toBe(false);
    });

    it('builds Restaurant JSON-LD with name, address, telephone, servesCuisine, hasMenu and strictly omits aggregateRating, hours, and priceRange', () => {
      const jsonLd = buildRestaurantJsonLd();
      const rawJson = JSON.stringify(jsonLd);

      expect(jsonLd['@type']).toBe('Restaurant');
      expect(jsonLd.name).toBe("Gee's Burger");
      expect(jsonLd.telephone).toBe('07044442424');
      expect(jsonLd.address.streetAddress).toContain('32 Bompai Road');
      expect(jsonLd.servesCuisine.length).toBeGreaterThan(0);
      expect(jsonLd.hasMenu.hasMenuSection.length).toBeGreaterThan(0);

      // Strictly forbidden fields
      expect(rawJson).not.toContain('aggregateRating');
      expect(rawJson).not.toContain('openingHours');
      expect(rawJson).not.toContain('priceRange');
    });
  });
});








