import type { PushAlertInput } from '@/state/actions';

/**
 * Canonical Stage 5.2 Alert Event Catalog.
 * State stays 100% serialisable (never stores functions in alerts).
 * Only raise alerts for real events in this catalog; never invent operational messages.
 */
export const alertEvents = {
  /**
   * Event: Item added from a card
   * Severity: success
   * Title / message: "Added to cart" / "3 × Fried Chicken (2 pcs)"
   * dedupeKey: added:{lineKey}
   * Action: none
   */
  itemAdded(params: {
    lineKey: string;
    qty: number;
    itemName: string;
    variantLabel?: string | null;
  }): PushAlertInput {
    const variantSuffix = params.variantLabel
      ? ` (${params.variantLabel})`
      : '';
    return {
      severity: 'success',
      title: 'Added to cart',
      message: `${params.qty} × ${params.itemName}${variantSuffix}`,
      dedupeKey: `added:${params.lineKey}`,
    };
  },

  /**
   * Event: Cart restored from storage
   * Severity: info
   * Title / message: "Welcome back" / "We restored your cart."
   * dedupeKey: restored
   * Action: none
   */
  cartRestored(): PushAlertInput {
    return {
      severity: 'info',
      title: 'Welcome back',
      message: 'We restored your cart.',
      dedupeKey: 'restored',
    };
  },

  /**
   * Event: Items dropped on hydrate
   * Severity: warning
   * Title / message: "Cart updated" / "Some items are no longer available and were removed."
   * dedupeKey: hydrate-dropped
   * Action: none
   */
  itemsDroppedOnHydrate(): PushAlertInput {
    return {
      severity: 'warning',
      title: 'Cart updated',
      message: 'Some items are no longer available and were removed.',
      dedupeKey: 'hydrate-dropped',
    };
  },

  /**
   * Event: Submit conflict (OUT_OF_STOCK)
   * Severity: warning
   * Title / message: "Some items changed" / "Please review the highlighted items."
   * dedupeKey: conflict
   * Action: reviewCart
   */
  submitConflict(): PushAlertInput {
    return {
      severity: 'warning',
      title: 'Some items changed',
      message: 'Please review the highlighted items.',
      dedupeKey: 'conflict',
      action: {
        label: 'Review cart',
        kind: 'reviewCart',
      },
    };
  },

  /**
   * Event: Prices changed (PRICE_CHANGED)
   * Severity: warning
   * Title / message: "Prices updated" / "Please review your new total."
   * dedupeKey: price-changed
   * Action: none
   */
  pricesChanged(): PushAlertInput {
    return {
      severity: 'warning',
      title: 'Prices updated',
      message: 'Please review your new total.',
      dedupeKey: 'price-changed',
    };
  },

  /**
   * Event: Network failure or timeout on submit
   * Severity: error, sticky
   * Title / message: "Network disconnected" / "We couldn't send your order. Check your connection and try again."
   * dedupeKey: submit-network
   * Action: retrySubmit
   */
  submitNetworkFailure(): PushAlertInput {
    return {
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
    };
  },

  /**
   * Event: Rate limited
   * Severity: warning
   * Title / message: "Too many attempts" / "Please wait a moment and try again."
   * dedupeKey: rate-limit
   * Action: none
   */
  rateLimited(): PushAlertInput {
    return {
      severity: 'warning',
      title: 'Too many attempts',
      message: 'Please wait a moment and try again.',
      dedupeKey: 'rate-limit',
    };
  },

  /**
   * Event: Order created
   * Severity: success
   * Title / message: "Order sent" / "Opening WhatsApp…"
   * dedupeKey: order-sent
   * Action: none
   */
  orderCreated(): PushAlertInput {
    return {
      severity: 'success',
      title: 'Order sent',
      message: 'Opening WhatsApp…',
      dedupeKey: 'order-sent',
    };
  },

  /**
   * Event: localStorage unavailable (private browsing / storage disabled)
   * Severity: warning
   * Title / message: "Storage unavailable" / "Your cart is saved for this tab only."
   * dedupeKey: storage-unavailable
   * Action: none
   */
  storageUnavailable(): PushAlertInput {
    return {
      severity: 'warning',
      title: 'Storage unavailable',
      message: 'Your cart is saved in memory for this tab only.',
      dedupeKey: 'storage-unavailable',
    };
  },
};
