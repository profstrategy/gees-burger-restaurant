import type { AlertAction } from '@/state/types';

type RetrySubmitHandler = () => void;

let currentRetrySubmitHandler: RetrySubmitHandler | null = null;

/**
 * Registers the active `useSubmitOrder().retry` handler so AlertViewport
 * can map `action.kind === 'retrySubmit'` without storing functions in state.
 */
export function registerRetrySubmitHandler(
  handler: RetrySubmitHandler
): () => void {
  currentRetrySubmitHandler = handler;
  return () => {
    if (currentRetrySubmitHandler === handler) {
      currentRetrySubmitHandler = null;
    }
  };
}

/**
 * Scrolls to the StockConflictBanner (or first affected line) when
 * `action.kind === 'reviewCart'` is triggered from AlertViewport.
 */
export function scrollToConflictBanner(navigateToCart?: () => void): void {
  if (typeof document === 'undefined') return;

  const bannerEl =
    document.querySelector<HTMLElement>('[data-conflict-banner]') ??
    document.querySelector<HTMLElement>('[data-conflict-line]');

  if (bannerEl) {
    bannerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const interactiveEl = bannerEl.querySelector<HTMLElement>('button, select');
    if (interactiveEl) {
      interactiveEl.focus({ preventScroll: true });
    } else {
      bannerEl.focus({ preventScroll: true });
    }
  } else if (navigateToCart) {
    navigateToCart();
  }
}

/**
 * Small handler registry used by AlertViewport to execute serialisable AlertAction descriptors:
 * - retrySubmit -> useSubmitOrder().retry
 * - reviewCart -> scroll to the conflict banner
 * - link -> navigate to action.href
 */
export function executeAlertAction(
  action: AlertAction,
  options?: {
    navigate?: (href: string) => void;
  }
): void {
  switch (action.kind) {
    case 'retrySubmit': {
      if (currentRetrySubmitHandler) {
        currentRetrySubmitHandler();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gees:retry-submit'));
      }
      return;
    }
    case 'reviewCart': {
      scrollToConflictBanner(() => {
        options?.navigate?.('/cart');
      });
      return;
    }
    case 'link': {
      if (action.href && options?.navigate) {
        options.navigate(action.href);
      }
      return;
    }
    default: {
      const _exhaustive: never = action.kind;
      return _exhaustive;
    }
  }
}
