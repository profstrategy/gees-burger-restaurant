'use client';

import React, { useCallback } from 'react';
import { catalogIndex } from '@/lib/catalog-index';
import { actions } from '@/state/actions';
import { useCart, useDispatch } from '@/state/context';
import { selectLineTotal } from '@/state/selectors';
import { CartLineCard } from '@/components/cart/CartLineCard';
import { CartLineSkeleton } from '@/components/cart/CartLineSkeleton';

/**
 * CartLineList renders CartLineSkeleton while !isHydrated,
 * and maps cart.lines to CartLineCard + indented CartAddOnRow items.
 */
export function CartLineList() {
  const cart = useCart();
  const dispatch = useDispatch();

  const handleSetLineQty = useCallback(
    (key: string, qty: number) => {
      dispatch(actions.cart.setQty({ key, qty }));
    },
    [dispatch]
  );

  const handleSetLineVariant = useCallback(
    (key: string, variantId: string) => {
      dispatch(actions.cart.setVariant({ key, variantId }));
    },
    [dispatch]
  );

  const handleSetLineAddOnQty = useCallback(
    (key: string, addOnId: string, qty: number) => {
      dispatch(actions.cart.setAddOnQty({ key, addOnId, qty }));
    },
    [dispatch]
  );

  const handleRemoveLineByKey = useCallback(
    (key: string) => {
      dispatch(actions.cart.removeLine({ key }));
    },
    [dispatch]
  );

  if (!cart.isHydrated) {
    return <CartLineSkeleton count={2} />;
  }

  return (
    <section aria-label="Items in order" className="space-y-4">
      {cart.lines.map((line) => {
        const item = catalogIndex.itemsById.get(line.itemId);
        if (!item) return null;

        const allVariants = catalogIndex.variantsByItemId.get(item.id) ?? [];
        const variant = line.variantId
          ? catalogIndex.variantsById.get(line.variantId)
          : undefined;
        const lineTotal = selectLineTotal(line, catalogIndex);
        const conflictMessage = cart.conflicts[line.key];

        return (
          <CartLineCard
            key={line.key}
            line={line}
            item={item}
            variant={variant}
            allVariants={allVariants}
            addOnsById={catalogIndex.addOnsById}
            lineTotal={lineTotal}
            conflictMessage={conflictMessage}
            onSetLineQty={handleSetLineQty}
            onSetLineVariant={handleSetLineVariant}
            onSetLineAddOnQty={handleSetLineAddOnQty}
            onRemoveLineByKey={handleRemoveLineByKey}
          />
        );
      })}
    </section>
  );
}

export default CartLineList;
