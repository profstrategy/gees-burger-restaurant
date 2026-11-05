'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MenuItem } from '@/types/catalog';
import { alertEvents } from '@/lib/alert-events';
import { getCatalogIndex } from '@/lib/catalog-index';
import { formatNaira, multiply, sum, toInt } from '@/lib/money';
import { actions } from '@/state/actions';
import { useDispatch } from '@/state/context';
import type { CatalogIndexLike } from '@/state/selectors';
import {
  buildCartLineKey,
  clampCartQty,
  MAX_CART_QTY,
  MIN_CART_QTY,
} from '@/state/slices/cart.reducer';

export type MenuCardLayout = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Pure helper that derives one of the 5 MenuCard layouts strictly from catalog item data:
 *
 * Composition | Variants | Add-ons | Layout
 * ------------|----------|---------|-------
 * yes         | yes      | any     | A (full: description, "Choose variant:", optional "Choose add-ons:", collapsible)
 * no          | yes      | any     | B (variants shown immediately, add-ons with steppers, no description, no collapse)
 * any         | no       | yes     | E (add-ons only; description shown if present)
 * yes         | no       | no      | D (simple with description)
 * no          | no       | no      | C (simple: image, name, price, Add)
 */
export function deriveMenuCardLayout(input: {
  hasComposition: boolean;
  hasVariants: boolean;
  hasAddOns: boolean;
}): MenuCardLayout {
  const { hasComposition, hasVariants, hasAddOns } = input;
  if (hasVariants) {
    return hasComposition ? 'A' : 'B';
  }
  if (hasAddOns) {
    return 'E';
  }
  return hasComposition ? 'D' : 'C';
}

export interface MenuCardVariantOption {
  id: string;
  label: string;
  price: number;
  formattedPrice: string;
  disabled: boolean;
}

export interface MenuCardAddOnOption {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  disabled: boolean;
  selected: boolean;
  qty: number;
}

export interface MenuCardHandlers {
  selectVariant: (variantId: string) => void;
  setQty: (nextQty: number) => void;
  incrementQty: () => void;
  decrementQty: () => void;
  toggleAddOn: (addOnId: string) => void;
  setAddOnQty: (addOnId: string, nextQty: number) => void;
  incrementAddOnQty: (addOnId: string) => void;
  decrementAddOnQty: (addOnId: string) => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  handleImageError: () => void;
  handleAdd: () => void;
}

export interface MenuCardViewModel {
  itemId: string;
  name: string;
  composition: string | null;
  layout: MenuCardLayout;
  resolvedImage: string | null;
  isSpicy: boolean;
  status: 'in_stock' | 'stock_out';
  isSoldOut: boolean;
  variants: MenuCardVariantOption[];
  firstVariantHint: {
    label: string;
    price: number;
    formattedPrice: string;
  } | null;
  addOns: MenuCardAddOnOption[];
  selectedVariantId: string | null;
  selectedVariant: MenuCardVariantOption | null;
  qty: number;
  addOnQuantities: Record<string, number>;
  unitPrice: number;
  formattedUnitPrice: string;
  lineTotal: number;
  formattedLineTotal: string;
  canAdd: boolean;
  justAdded: boolean;
  isExpanded: boolean;
  handlers: MenuCardHandlers;
}

export interface UseMenuCardModelOptions {
  /** Optional initial expanded state for Layout A cards (defaults to false so collapsed "from ₦X" hint is shown, or true when specified) */
  initialExpanded?: boolean;
}

export function useMenuCardModel(
  item: MenuItem,
  catalogIndex: CatalogIndexLike = getCatalogIndex(),
  options?: UseMenuCardModelOptions
): MenuCardViewModel {
  const dispatch = useDispatch();

  const rawVariants = useMemo(
    () => catalogIndex.variantsByItemId.get(item.id) ?? [],
    [catalogIndex.variantsByItemId, item.id]
  );

  const variants: MenuCardVariantOption[] = useMemo(
    () =>
      rawVariants.map((v) => {
        const priceInt = toInt(v.price);
        return {
          id: v.id,
          label: v.label,
          price: priceInt,
          formattedPrice: formatNaira(priceInt),
          disabled: v.status === 'stock_out',
        };
      }),
    [rawVariants]
  );

  const rawAddOns = useMemo(
    () =>
      item.addOnId
        .map((id) => catalogIndex.addOnsById.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [catalogIndex.addOnsById, item.addOnId]
  );

  const hasComposition = Boolean(
    item.composition && item.composition.trim().length > 0
  );
  const hasVariants = variants.length > 0;
  const hasAddOns = rawAddOns.length > 0;

  const layout = useMemo(
    () =>
      deriveMenuCardLayout({
        hasComposition,
        hasVariants,
        hasAddOns,
      }),
    [hasComposition, hasVariants, hasAddOns]
  );

  // Default variant: first in-stock; if none in stock, null (and whole card is sold out)
  const defaultVariantId = useMemo(() => {
    if (!hasVariants) return null;
    const firstInStock = variants.find((v) => !v.disabled);
    return firstInStock ? firstInStock.id : null;
  }, [hasVariants, variants]);

  const firstVariantHint = useMemo(() => {
    if (!hasVariants) return null;
    const target = variants.find((v) => !v.disabled) ?? variants[0];
    if (!target) return null;
    return {
      label: target.label,
      price: target.price,
      formattedPrice: target.formattedPrice,
    };
  }, [hasVariants, variants]);

  // Effective status: sold out if item is stock_out OR if it has variants and none are in stock
  const isSoldOut =
    item.status === 'stock_out' || (hasVariants && defaultVariantId === null);
  const status: 'in_stock' | 'stock_out' = isSoldOut ? 'stock_out' : 'in_stock';

  const [selectedVariantState, setSelectedVariantState] = useState<{
    itemId: string;
    variantId: string | null;
  }>({
    itemId: item.id,
    variantId: defaultVariantId,
  });

  const selectedVariantId = useMemo(() => {
    if (!hasVariants) return null;
    const candidate =
      selectedVariantState.itemId === item.id
        ? selectedVariantState.variantId
        : defaultVariantId;
    if (
      candidate &&
      variants.some((v) => v.id === candidate && !v.disabled)
    ) {
      return candidate;
    }
    return defaultVariantId;
  }, [defaultVariantId, hasVariants, item.id, selectedVariantState, variants]);

  const selectedVariant = useMemo(
    () =>
      selectedVariantId
        ? variants.find((v) => v.id === selectedVariantId) ?? null
        : null,
    [selectedVariantId, variants]
  );

  const [qty, setQtyState] = useState<number>(MIN_CART_QTY);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>(
    {}
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(
    options?.initialExpanded ?? false
  );
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const resolvedImage =
    item.imageUrl && failedImageUrl !== item.imageUrl ? item.imageUrl : null;

  const addOns: MenuCardAddOnOption[] = useMemo(
    () =>
      rawAddOns.map((a) => {
        const priceInt = toInt(a.price);
        const disabled = a.status === 'stock_out';
        const currentQty = disabled ? 0 : addOnQuantities[a.id] ?? 0;
        return {
          id: a.id,
          name: a.name,
          price: priceInt,
          formattedPrice: formatNaira(priceInt),
          disabled,
          selected: currentQty > 0,
          qty: currentQty,
        };
      }),
    [addOnQuantities, rawAddOns]
  );

  const unitPrice = useMemo(() => {
    if (hasVariants) {
      if (selectedVariant) return selectedVariant.price;
      return firstVariantHint?.price ?? 0;
    }
    return item.price !== null ? toInt(item.price) : 0;
  }, [firstVariantHint, hasVariants, item.price, selectedVariant]);

  const lineTotal = useMemo(() => {
    const baseTotal = multiply(unitPrice, qty);
    const addOnAmounts = addOns
      .filter((a) => a.selected && a.qty > 0 && !a.disabled)
      .map((a) => multiply(a.price, a.qty));
    return sum([baseTotal, ...addOnAmounts]);
  }, [addOns, qty, unitPrice]);

  const canAdd =
    !isSoldOut &&
    qty >= MIN_CART_QTY &&
    qty <= MAX_CART_QTY &&
    (!hasVariants || selectedVariant !== null);

  const selectVariant = useCallback(
    (variantId: string) => {
      const target = variants.find((v) => v.id === variantId);
      if (!target || target.disabled) return;
      setSelectedVariantState({
        itemId: item.id,
        variantId,
      });
    },
    [item.id, variants]
  );

  const setQty = useCallback((nextQty: number) => {
    setQtyState(clampCartQty(nextQty));
  }, []);

  const incrementQty = useCallback(() => {
    setQtyState((prev) => clampCartQty(prev + 1));
  }, []);

  const decrementQty = useCallback(() => {
    setQtyState((prev) => clampCartQty(prev - 1));
  }, []);

  const ensureDefaultVariantSelected = useCallback(() => {
    if (!hasVariants || !defaultVariantId) return;
    setSelectedVariantState((prev) => {
      if (
        prev.itemId === item.id &&
        prev.variantId &&
        variants.some((v) => v.id === prev.variantId && !v.disabled)
      ) {
        return prev;
      }
      return {
        itemId: item.id,
        variantId: defaultVariantId,
      };
    });
  }, [defaultVariantId, hasVariants, item.id, variants]);

  const toggleAddOn = useCallback(
    (addOnId: string) => {
      const target = rawAddOns.find((a) => a.id === addOnId);
      if (!target || target.status === 'stock_out') return;

      ensureDefaultVariantSelected();

      setAddOnQuantities((prev) => {
        const current = prev[addOnId] ?? 0;
        if (current > 0) {
          const next = { ...prev };
          delete next[addOnId];
          return next;
        }
        return {
          ...prev,
          [addOnId]: 1,
        };
      });
    },
    [ensureDefaultVariantSelected, rawAddOns]
  );

  const setAddOnQty = useCallback(
    (addOnId: string, nextQty: number) => {
      const target = rawAddOns.find((a) => a.id === addOnId);
      if (!target || target.status === 'stock_out') return;

      ensureDefaultVariantSelected();

      const intVal = Number.isFinite(nextQty) ? Math.trunc(nextQty) : 0;
      setAddOnQuantities((prev) => {
        if (intVal <= 0) {
          const next = { ...prev };
          delete next[addOnId];
          return next;
        }
        return {
          ...prev,
          [addOnId]: clampCartQty(intVal),
        };
      });
    },
    [ensureDefaultVariantSelected, rawAddOns]
  );

  const incrementAddOnQty = useCallback(
    (addOnId: string) => {
      const target = rawAddOns.find((a) => a.id === addOnId);
      if (!target || target.status === 'stock_out') return;

      ensureDefaultVariantSelected();

      setAddOnQuantities((prev) => {
        const current = prev[addOnId] ?? 0;
        return {
          ...prev,
          [addOnId]: clampCartQty(current + 1),
        };
      });
    },
    [ensureDefaultVariantSelected, rawAddOns]
  );

  const decrementAddOnQty = useCallback((addOnId: string) => {
    setAddOnQuantities((prev) => {
      const current = prev[addOnId] ?? 0;
      if (current <= 1) {
        return {
          ...prev,
          [addOnId]: MIN_CART_QTY,
        };
      }
      return {
        ...prev,
        [addOnId]: clampCartQty(current - 1),
      };
    });
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  const handleImageError = useCallback(() => {
    if (item.imageUrl) {
      setFailedImageUrl(item.imageUrl);
    }
  }, [item.imageUrl]);

  const handleAdd = useCallback(() => {
    if (!canAdd) return;

    const effectiveVariantId = hasVariants
      ? selectedVariantId ?? defaultVariantId
      : null;
    if (hasVariants && !effectiveVariantId) return;

    const chosenAddOns = addOns
      .filter((a) => a.selected && a.qty > 0 && !a.disabled)
      .map((a) => ({
        addOnId: a.id,
        qty: clampCartQty(a.qty),
      }));

    const clampedQty = clampCartQty(qty);
    const lineKey = buildCartLineKey(item.id, effectiveVariantId);

    dispatch(
      actions.cart.addLine({
        itemId: item.id,
        variantId: effectiveVariantId,
        qty: clampedQty,
        addOns: chosenAddOns,
      })
    );

    dispatch(
      actions.alerts.push(
        alertEvents.itemAdded({
          lineKey,
          qty: clampedQty,
          itemName: item.item,
          variantLabel: selectedVariant?.label ?? null,
        })
      )
    );

    // Show "Added ✓" for 1.5 s
    setJustAdded(true);
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    addedTimerRef.current = window.setTimeout(() => {
      setJustAdded(false);
      addedTimerRef.current = null;
    }, 1500);

    // Reset local state after adding
    setQtyState(MIN_CART_QTY);
    setAddOnQuantities({});
    setSelectedVariantState({
      itemId: item.id,
      variantId: defaultVariantId,
    });
  }, [
    addOns,
    canAdd,
    defaultVariantId,
    dispatch,
    hasVariants,
    item.id,
    item.item,
    qty,
    selectedVariant,
    selectedVariantId,
  ]);

  const handlers: MenuCardHandlers = useMemo(
    () => ({
      selectVariant,
      setQty,
      incrementQty,
      decrementQty,
      toggleAddOn,
      setAddOnQty,
      incrementAddOnQty,
      decrementAddOnQty,
      toggleExpanded,
      setExpanded,
      handleImageError,
      handleAdd,
    }),
    [
      decrementAddOnQty,
      decrementQty,
      handleAdd,
      handleImageError,
      incrementAddOnQty,
      incrementQty,
      selectVariant,
      setAddOnQty,
      setExpanded,
      setQty,
      toggleAddOn,
      toggleExpanded,
    ]
  );

  return {
    itemId: item.id,
    name: item.item,
    composition: hasComposition ? item.composition : null,
    layout,
    resolvedImage,
    isSpicy: item.isSpicy,
    status,
    isSoldOut,
    variants,
    firstVariantHint,
    addOns,
    selectedVariantId,
    selectedVariant,
    qty,
    addOnQuantities,
    unitPrice,
    formattedUnitPrice: formatNaira(unitPrice),
    lineTotal,
    formattedLineTotal: formatNaira(lineTotal),
    canAdd,
    justAdded,
    isExpanded,
    handlers,
  };
}
