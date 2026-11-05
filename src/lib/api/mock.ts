import catalogData from '@/data/catalog.json';
import deliveryAreasData from '@/data/delivery-areas.json';
import faqData from '@/data/faq.json';
import reviewsData from '@/data/reviews.json';
import type { GeesCatalog } from '@/types/catalog';
import type {
  ApiClient,
  DeliveryArea,
  FaqItem,
  NewsletterSubscriptionPayload,
  NewsletterSubscriptionResult,
  OrderSubmissionPayload,
  OrderSubmissionResult,
  ReviewItem,
} from '@/lib/api/types';
import { buildWhatsAppOrderMessage } from '@/lib/catalog-helpers';

const catalog = catalogData as GeesCatalog;
const deliveryAreas = deliveryAreasData as DeliveryArea[];
const faqs = faqData as FaqItem[];
const reviews = reviewsData as ReviewItem[];

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

export const mockApiClient: ApiClient = {
  async getCatalog(signal?: AbortSignal): Promise<GeesCatalog> {
    throwIfAborted(signal);
    return catalog;
  },

  async getDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]> {
    throwIfAborted(signal);
    return deliveryAreas.filter((area) => area.isActive);
  },

  async getFaqs(signal?: AbortSignal): Promise<FaqItem[]> {
    throwIfAborted(signal);
    return faqs;
  },

  async getReviews(signal?: AbortSignal): Promise<ReviewItem[]> {
    throwIfAborted(signal);
    return reviews;
  },

  async submitOrder(
    payload: OrderSubmissionPayload,
    signal?: AbortSignal
  ): Promise<OrderSubmissionResult> {
    throwIfAborted(signal);
    const built = buildWhatsAppOrderMessage(catalog, deliveryAreas, payload);
    return {
      orderId: payload.orderId,
      whatsappUrl: built.whatsappUrl,
      messagePreview: built.messagePreview,
      subtotal: built.subtotal,
      deliveryFee: built.deliveryFee,
      total: built.total,
    };
  },

  async subscribeNewsletter(
    payload: NewsletterSubscriptionPayload,
    signal?: AbortSignal
  ): Promise<NewsletterSubscriptionResult> {
    throwIfAborted(signal);
    if (!payload.email || !payload.email.includes('@')) {
      return {
        ok: false,
        message: 'Please enter a valid email address.',
      };
    }
    return {
      ok: true,
      message: "You're on the list! Watch your inbox for Gee's Burger updates.",
    };
  },
};
