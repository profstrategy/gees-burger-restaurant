'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  type OrderSubmissionPayload,
  type OrderSubmissionResult,
} from '@/lib/api';
import { registerRetrySubmitHandler } from '@/lib/alert-action-registry';
import { alertEvents } from '@/lib/alert-events';
import { actions } from '@/state/actions';
import { useCart, useDispatch } from '@/state/context';

export const SUBMIT_TIMEOUT_MS = 15_000;

export interface SubmitApiError extends Error {
  code?:
    | 'OUT_OF_STOCK'
    | 'PRICE_CHANGED'
    | 'VALIDATION'
    | 'RATE_LIMIT'
    | 'RATE_LIMITED'
    | 'NETWORK'
    | 'NETWORK_ERROR'
    | 'TIMEOUT';
  conflicts?: Record<string, string>;
  fieldErrors?: Record<string, string>;
}

export interface UseSubmitOrderOptions {
  onValidationErrors?: (fieldErrors: Record<string, string>) => void;
  onCatalogRefresh?: () => void;
}

export interface UseSubmitOrderResult {
  submit: (
    payload: Omit<OrderSubmissionPayload, 'orderId' | 'idempotencyKey'> & {
      orderId?: string;
      idempotencyKey?: string;
    }
  ) => Promise<OrderSubmissionResult | null>;
  retry: () => void;
  reset: () => void;
  idempotencyKey: string;
  isSubmitting: boolean;
  result: OrderSubmissionResult | null;
  popupBlocked: boolean;
  error: string | null;
}

function generateIdempotencyKey(): string {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase().slice(-4);
  return `GB-${timePart}${randomPart}`;
}

/**
 * Stage 5.4 useSubmitOrder hook:
 * - Disables the button and blocks a second submit while in flight
 * - Creates an idempotency key once per checkout session (resets after success or when the cart changes)
 * - Calls window.open("", "_blank") synchronously on click (before await), then awaits api.createOrder(payload, signal) with a 15 s timeout
 * - On success: cart/clear, success alert, sets the blank tab URL to whatsappUrl; shows OrderSuccessPanel with manual "Open WhatsApp" button
 * - On failure: closes the blank tab
 * - Maps OUT_OF_STOCK -> cart/setConflicts + conflict alert; PRICE_CHANGED -> refresh catalog + alert;
 *   VALIDATION -> field errors; NETWORK/timeout -> OrderErrorBanner + sticky alert; RATE_LIMIT -> alert.
 * - Never loses the form data.
 */
export function useSubmitOrder(
  options?: UseSubmitOrderOptions
): UseSubmitOrderResult {
  const cart = useCart();
  const dispatch = useDispatch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<OrderSubmissionResult | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);

  const isSubmittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPayloadRef = useRef<OrderSubmissionPayload | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Cart signature to reset the idempotency key whenever the cart changes
  const cartSignature = useMemo(
    () =>
      cart.lines
        .map(
          (l) =>
            `${l.key}:${l.qty}:${l.addOns
              .map((a) => `${a.addOnId}x${a.qty}`)
              .join(',')}`
        )
        .join('|'),
    [cart.lines]
  );

  // Idempotency key created once per checkout session, reset when cartSignature or sessionNonce changes
  const idempotencyKey = useMemo(() => {
    void cartSignature;
    void sessionNonce;
    return generateIdempotencyKey();
  }, [cartSignature, sessionNonce]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const submit = useCallback(
    async (
      rawPayload: Omit<OrderSubmissionPayload, 'orderId' | 'idempotencyKey'> & {
        orderId?: string;
        idempotencyKey?: string;
      }
    ): Promise<OrderSubmissionResult | null> => {
      // Block a second submit while in flight
      if (isSubmittingRef.current) return null;

      // Open blank tab synchronously on click before any await (iOS popup blocker rule)
      let blankTab: Window | null = null;
      if (typeof window !== 'undefined') {
        try {
          blankTab = window.open('', '_blank');
        } catch {
          blankTab = null;
        }
      }

      const effectiveKey = rawPayload.idempotencyKey || idempotencyKey;
      const effectiveOrderId = rawPayload.orderId || effectiveKey;

      const payload: OrderSubmissionPayload = {
        ...rawPayload,
        orderId: effectiveOrderId,
        idempotencyKey: effectiveKey,
      };

      lastPayloadRef.current = payload;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, SUBMIT_TIMEOUT_MS);

      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          const offlineErr: SubmitApiError = new Error(
            "We couldn't send your order. Check your connection and try again."
          );
          offlineErr.code = 'NETWORK';
          throw offlineErr;
        }

        const orderResult = await api.createOrder(payload, controller.signal);
        window.clearTimeout(timeoutId);

        // On success: cart/clear, success alert, set tab URL to whatsappUrl
        dispatch(actions.cart.clear());
        dispatch(actions.alerts.push(alertEvents.orderCreated()));

        if (blankTab && !blankTab.closed) {
          try {
            blankTab.location.href = orderResult.whatsappUrl;
            setPopupBlocked(false);
          } catch {
            setPopupBlocked(true);
          }
        } else {
          setPopupBlocked(true);
        }

        setResult(orderResult);
        // Reset idempotency key after success
        setSessionNonce((n) => n + 1);

        return orderResult;
      } catch (err: unknown) {
        window.clearTimeout(timeoutId);

        // Always close the blank tab on failure
        if (blankTab && !blankTab.closed) {
          try {
            blankTab.close();
          } catch {
            // Ignore close failure
          }
        }

        // If aborted by unmount/manual cancel (not timeout), exit quietly
        if (
          !didTimeout &&
          err instanceof DOMException &&
          err.name === 'AbortError'
        ) {
          return null;
        }

        const apiErr = err as SubmitApiError | undefined;
        const code = didTimeout ? 'TIMEOUT' : apiErr?.code;
        const rawMessage =
          err instanceof Error ? err.message : 'Network error';

        if (
          code === 'OUT_OF_STOCK' ||
          /out of stock|no longer available/i.test(rawMessage)
        ) {
          if (apiErr?.conflicts && Object.keys(apiErr.conflicts).length > 0) {
            dispatch(actions.cart.setConflicts(apiErr.conflicts));
          }
          dispatch(actions.alerts.push(alertEvents.submitConflict()));
        } else if (
          code === 'PRICE_CHANGED' ||
          /price.*changed|prices.*updated/i.test(rawMessage)
        ) {
          // Refresh the catalog and raise PRICE_CHANGED alert
          void api
            .getCatalog()
            .then(() => {
              optionsRef.current?.onCatalogRefresh?.();
            })
            .catch(() => {
              // Ignore background catalog refresh error
            });
          dispatch(actions.alerts.push(alertEvents.pricesChanged()));
        } else if (code === 'VALIDATION' && apiErr?.fieldErrors) {
          optionsRef.current?.onValidationErrors?.(apiErr.fieldErrors);
        } else if (
          code === 'RATE_LIMIT' ||
          code === 'RATE_LIMITED' ||
          /rate limit|too many attempts/i.test(rawMessage)
        ) {
          dispatch(actions.alerts.push(alertEvents.rateLimited()));
        } else {
          // NETWORK or 15 s timeout -> OrderErrorBanner + sticky network alert
          const networkMsg =
            "We couldn't send your order. Check your connection and try again.";
          setError(networkMsg);
          dispatch(actions.alerts.push(alertEvents.submitNetworkFailure()));
        }

        return null;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      dispatch,
      idempotencyKey,
      setError,
      setIsSubmitting,
      setPopupBlocked,
      setResult,
      setSessionNonce,
    ]
  );

  const retry = useCallback(() => {
    if (lastPayloadRef.current) {
      void submit(lastPayloadRef.current);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gees:retry-submit'));
    }
  }, [submit]);

  useEffect(() => {
    return registerRetrySubmitHandler(retry);
  }, [retry]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setResult(null);
    setPopupBlocked(false);
    setError(null);
    lastPayloadRef.current = null;
    setSessionNonce((n) => n + 1);
  }, [setError, setIsSubmitting, setPopupBlocked, setResult, setSessionNonce]);

  return {
    submit,
    retry,
    reset,
    idempotencyKey,
    isSubmitting,
    result,
    popupBlocked,
    error,
  };
}

export default useSubmitOrder;
