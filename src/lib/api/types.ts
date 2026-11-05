import type { EntityId, GeesCatalog, ISODateString, Money } from '@/types/catalog';

export interface DeliveryArea {
  id: EntityId;
  name: string;
  bikeFee: Money;
  carFee: Money;
  isActive: boolean;
  _placeholder?: boolean;
}

export interface FaqItem {
  id: EntityId;
  question: string;
  answer: string;
  needsClientConfirmation: boolean;
}

export interface ReviewItem {
  id: EntityId;
  name: string;
  rating: number;
  text: string;
  source: 'google' | string;
}

export type FulfillmentType = 'pickup' | 'delivery';
export type TransportMode = 'bike' | 'car';

export interface OrderLinePayload {
  lineId: string;
  itemId: EntityId;
  variantId: EntityId | null;
  addOnIds: EntityId[];
  quantity: number;
}

export interface OrderSubmissionPayload {
  orderId: string;
  createdAt: ISODateString;
  customerName: string;
  customerPhone: string;
  fulfillment: FulfillmentType;
  deliveryAreaId: EntityId | null;
  transportMode: TransportMode | null;
  address: string | null;
  landmark: string | null;
  notes: string | null;
  lines: OrderLinePayload[];
}

export interface OrderSubmissionResult {
  orderId: string;
  whatsappUrl: string;
  messagePreview: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface NewsletterSubscriptionPayload {
  email: string;
  subscribedAt: ISODateString;
}

export interface NewsletterSubscriptionResult {
  ok: boolean;
  message: string;
}

export interface ApiClient {
  getCatalog(signal?: AbortSignal): Promise<GeesCatalog>;
  getDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]>;
  getFaqs(signal?: AbortSignal): Promise<FaqItem[]>;
  getReviews(signal?: AbortSignal): Promise<ReviewItem[]>;
  submitOrder(
    payload: OrderSubmissionPayload,
    signal?: AbortSignal
  ): Promise<OrderSubmissionResult>;
  subscribeNewsletter(
    payload: NewsletterSubscriptionPayload,
    signal?: AbortSignal
  ): Promise<NewsletterSubscriptionResult>;
}
