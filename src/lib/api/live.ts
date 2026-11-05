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

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export const liveApiClient: ApiClient = {
  getCatalog(signal?: AbortSignal): Promise<GeesCatalog> {
    return fetchJson<GeesCatalog>('/api/catalog', { signal });
  },

  getDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]> {
    return fetchJson<DeliveryArea[]>('/api/delivery-areas', { signal });
  },

  getFaqs(signal?: AbortSignal): Promise<FaqItem[]> {
    return fetchJson<FaqItem[]>('/api/faqs', { signal });
  },

  getReviews(signal?: AbortSignal): Promise<ReviewItem[]> {
    return fetchJson<ReviewItem[]>('/api/reviews', { signal });
  },

  createOrder(
    payload: CreateOrderInput,
    signal?: AbortSignal
  ): Promise<CreateOrderResult> {
    return fetchJson<CreateOrderResult>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  submitOrder(
    payload: OrderSubmissionPayload,
    signal?: AbortSignal
  ): Promise<OrderSubmissionResult> {
    return this.createOrder(payload, signal);
  },

  subscribeNewsletter(
    payload: NewsletterSubscriptionPayload,
    signal?: AbortSignal
  ): Promise<NewsletterSubscriptionResult> {
    return fetchJson<NewsletterSubscriptionResult>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },
};
