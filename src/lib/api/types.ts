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
  addOns?: { addOnId: EntityId; qty: number }[];
  quantity: number;
}

export interface OrderSubmissionPayload {
  orderId: string;
  idempotencyKey?: string;
  createdAt: ISODateString;
  customerName: string;
  customerPhone: string;
  homeAddress?: string | null;
  fulfillment: FulfillmentType;
  deliveryAreaId: EntityId | null;
  transportMode: TransportMode | null;
  address: string | null;
  exactAddress?: string | null;
  landmark?: string | null;
  notes?: string | null;
  lines: OrderLinePayload[];
}

export type CreateOrderInput = OrderSubmissionPayload;

export interface CreateOrderResult {
  orderId: string;
  total: number;
  deliveryFee: number;
  subtotal: number;
  summaryText: string;
  messagePreview: string;
  whatsappUrl: string;
}

export type OrderSubmissionResult = CreateOrderResult;

export interface NewsletterSubscriptionPayload {
  email: string;
  subscribedAt: ISODateString;
  website?: string;
}

export interface NewsletterSubscriptionResult {
  ok: boolean;
  status?: 'success' | 'already_subscribed' | 'error';
  message: string;
}

export interface ApiClient {
  getCatalog(signal?: AbortSignal): Promise<GeesCatalog>;
  getDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]>;
  getFaqs(signal?: AbortSignal): Promise<FaqItem[]>;
  getReviews(signal?: AbortSignal): Promise<ReviewItem[]>;
  createOrder(
    payload: CreateOrderInput,
    signal?: AbortSignal
  ): Promise<CreateOrderResult>;
  submitOrder(
    payload: OrderSubmissionPayload,
    signal?: AbortSignal
  ): Promise<OrderSubmissionResult>;
  subscribeNewsletter(
    payload: NewsletterSubscriptionPayload,
    signal?: AbortSignal
  ): Promise<NewsletterSubscriptionResult>;
}
