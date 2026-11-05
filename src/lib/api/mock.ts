/**
 * Mock ApiClient implementation for Gee's Burger:
 * - Simulated network latency between 600–900 ms
 * - Full AbortSignal support (aborts immediately before/during delay)
 * - Configurable failure rate via NEXT_PUBLIC_MOCK_FAIL_RATE (0 to 1)
 * - Re-pricing strictly from the validated catalog (never trusts client prices)
 * - Stock check against catalog items, variants, and add-ons
 * - Idempotency persisted in localStorage under "gees.orders"
 * - getCatalog returns catalog.json, getDeliveryAreas returns delivery-areas.json
 * - createOrder returns { orderId, total, deliveryFee, summaryText, whatsappUrl }
 */
import deliveryAreasData from '@/data/delivery-areas.json';
import faqData from '@/data/faq.json';
import reviewsData from '@/data/reviews.json';
import type { GeesCatalog } from '@/types/catalog';
import type {
  ApiClient,
  CreateOrderInput,
  CreateOrderResult,
  DeliveryArea,
  FaqItem,
  NewsletterSubscriptionPayload,
  NewsletterSubscriptionResult,
  OrderSubmissionPayload,
  OrderSubmissionResult,
  ReviewItem,
} from '@/lib/api/types';
import {
  addOnsById,
  itemsById,
  validatedCatalog,
  variantsById,
  variantsByItemId,
} from '@/lib/catalog-index';
import { buildWhatsAppOrderMessage } from '@/lib/catalog-helpers';

const ORDERS_STORAGE_KEY = 'gees.orders';

const deliveryAreas = deliveryAreasData as DeliveryArea[];
const faqs = faqData as FaqItem[];
const reviews = reviewsData as ReviewItem[];

interface StoredOrdersMap {
  [idempotencyKey: string]: CreateOrderResult & {
    createdAt: string;
    fullMessage?: string;
    lines?: OrderSubmissionPayload['lines'];
  };
}

function getFailRate(): number {
  const raw = process.env.NEXT_PUBLIC_MOCK_FAIL_RATE;
  if (!raw) return 0;
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed) || parsed <= 0) return 0;
  return Math.min(1, parsed);
}

function simulateNetworkLatency(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      new DOMException('The operation was aborted.', 'AbortError')
    );
  }

  const delayMs = 600 + Math.floor(Math.random() * 301); // 600–900 ms

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      const failRate = getFailRate();
      if (failRate > 0 && Math.random() < failRate) {
        reject(new Error('Simulated network error (NEXT_PUBLIC_MOCK_FAIL_RATE)'));
        return;
      }
      resolve();
    }, delayMs);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function readStoredOrders(): StoredOrdersMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as StoredOrdersMap;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStoredOrder(
  key: string,
  record: CreateOrderResult & {
    createdAt: string;
    fullMessage?: string;
    lines?: OrderSubmissionPayload['lines'];
  }
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readStoredOrders();
    current[key] = record;
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

function assertStockAndCatalogIntegrity(payload: CreateOrderInput): void {
  if (!payload.lines || payload.lines.length === 0) {
    throw new Error('Cannot create an order with an empty cart.');
  }

  const conflicts: Record<string, string> = {};

  for (const line of payload.lines) {
    const item = itemsById.get(line.itemId);
    if (!item || item.status === 'stock_out') {
      const name = item ? item.item : line.itemId;
      conflicts[line.lineId] = `${name} is no longer available. Choose another option or remove it.`;
      continue;
    }

    const itemVariants = variantsByItemId.get(item.id) ?? [];
    if (itemVariants.length > 0) {
      const chosenVariantId = line.variantId ?? itemVariants[0]?.id;
      const variant = chosenVariantId
        ? variantsById.get(chosenVariantId)
        : undefined;
      if (!variant || variant.itemId !== item.id || variant.status === 'stock_out') {
        const label = variant ? `${item.item} (${variant.label})` : item.item;
        conflicts[line.lineId] = `${label} is no longer available. Choose another option or remove it.`;
        continue;
      }
    }

    for (const addOnId of line.addOnIds) {
      const addOn = addOnsById.get(addOnId);
      if (!addOn || addOn.status === 'stock_out') {
        conflicts[line.lineId] = `${item.item} add-on is no longer available. Choose another option or remove it.`;
      }
    }
  }

  if (Object.keys(conflicts).length > 0) {
    const err = new Error('Some items in your cart are out of stock.') as Error & {
      code: 'OUT_OF_STOCK';
      conflicts: Record<string, string>;
    };
    err.code = 'OUT_OF_STOCK';
    err.conflicts = conflicts;
    throw err;
  }
}

const NEWSLETTER_STORAGE_KEY = 'gees.newsletter.v1';
const memorySubscribedEmails = new Set<string>();

function readSubscribedEmails(): Set<string> {
  const set = new Set<string>(memorySubscribedEmails);
  if (typeof window === 'undefined') return set;
  try {
    const raw = window.localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    if (!raw) return set;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === 'string') {
          set.add(item.trim().toLowerCase());
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return set;
}

function saveSubscribedEmail(email: string): void {
  const normalized = email.trim().toLowerCase();
  memorySubscribedEmails.add(normalized);
  if (typeof window === 'undefined') return;
  try {
    const current = readSubscribedEmails();
    current.add(normalized);
    window.localStorage.setItem(
      NEWSLETTER_STORAGE_KEY,
      JSON.stringify(Array.from(current))
    );
  } catch {
    // Ignore storage write errors
  }
}

export const mockApiClient: ApiClient = {
  async getCatalog(signal?: AbortSignal): Promise<GeesCatalog> {
    await simulateNetworkLatency(signal);
    return validatedCatalog;
  },

  async getDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]> {
    await simulateNetworkLatency(signal);
    return deliveryAreas;
  },

  async getFaqs(signal?: AbortSignal): Promise<FaqItem[]> {
    await simulateNetworkLatency(signal);
    return faqs;
  },

  async getReviews(signal?: AbortSignal): Promise<ReviewItem[]> {
    await simulateNetworkLatency(signal);
    return reviews;
  },

  async createOrder(
    payload: CreateOrderInput,
    signal?: AbortSignal
  ): Promise<CreateOrderResult> {
    await simulateNetworkLatency(signal);

    const idempotencyKey = payload.idempotencyKey || payload.orderId;
    const stored = readStoredOrders();
    if (idempotencyKey && stored[idempotencyKey]) {
      return stored[idempotencyKey];
    }

    // Verify stock and catalog membership
    assertStockAndCatalogIntegrity(payload);

    // Re-price strictly from the catalog using src/lib/money.ts
    const built = buildWhatsAppOrderMessage(
      validatedCatalog,
      deliveryAreas,
      payload
    );

    const result: CreateOrderResult = {
      orderId: payload.orderId,
      total: built.total,
      deliveryFee: built.deliveryFee,
      subtotal: built.subtotal,
      summaryText: built.messagePreview,
      messagePreview: built.messagePreview,
      whatsappUrl: built.whatsappUrl,
    };

    if (idempotencyKey) {
      writeStoredOrder(idempotencyKey, {
        ...result,
        fullMessage: built.fullMessage,
        lines: payload.lines,
        createdAt: payload.createdAt || new Date().toISOString(),
      });
    }

    return result;
  },

  async submitOrder(
    payload: OrderSubmissionPayload,
    signal?: AbortSignal
  ): Promise<OrderSubmissionResult> {
    return this.createOrder(payload, signal);
  },

  async subscribeNewsletter(
    payload: NewsletterSubscriptionPayload,
    signal?: AbortSignal
  ): Promise<NewsletterSubscriptionResult> {
    await simulateNetworkLatency(signal);
    const normalized = (payload.email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return {
        ok: false,
        status: 'error',
        message: 'Please enter a valid email address.',
      };
    }

    const existing = readSubscribedEmails();
    if (existing.has(normalized)) {
      return {
        ok: false,
        status: 'already_subscribed',
        message: 'You are already subscribed with this email.',
      };
    }

    saveSubscribedEmail(normalized);
    return {
      ok: true,
      status: 'success',
      message: "You're in.",
    };
  },
};

