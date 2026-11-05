'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Store,
  Truck,
} from 'lucide-react';
import deliveryAreasFallback from '@/data/delivery-areas.json';
import {
  api,
  type DeliveryArea,
  type OrderSubmissionResult,
  type TransportMode,
} from '@/lib/api';
import { useCart } from '@/context/cart-context';
import { resolveDeliveryFee } from '@/lib/catalog-helpers';
import { formatNaira, sum } from '@/lib/money';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DeliveryAreaField = dynamic(
  () => import('@/components/cart/delivery-area-field'),
  {
    loading: () => (
      <div className="h-32 rounded-xl border border-white/10 bg-[#101010] p-4 animate-pulse" />
    ),
  }
);

const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, 'Please enter your full name'),
    customerPhone: z
      .string()
      .trim()
      .min(7, 'Please enter a valid phone number'),
    fulfillment: z.enum(['pickup', 'delivery']),
    deliveryAreaId: z.string().optional(),
    transportMode: z.enum(['bike', 'car']),
    address: z.string().trim().optional(),
    landmark: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.fulfillment === 'delivery') {
      if (!values.deliveryAreaId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deliveryAreaId'],
          message: 'Please choose your delivery area in Kano',
        });
      }
      if (!values.address || values.address.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: 'Please enter your street/house delivery address',
        });
      }
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutForm() {
  const { state, subtotal, clearCart } = useCart();
  const [areas, setAreas] = useState<DeliveryArea[]>(
    (deliveryAreasFallback as DeliveryArea[]).filter((a) => a.isActive)
  );
  const [submissionResult, setSubmissionResult] =
    useState<OrderSubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const submitAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .getDeliveryAreas(controller.signal)
      .then((data) => {
        if (data.length > 0) {
          setAreas(data);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      submitAbortRef.current?.abort();
    };
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      fulfillment: 'delivery',
      deliveryAreaId: areas[0]?.id ?? 'area_bompai',
      transportMode: 'bike',
      address: '',
      landmark: '',
      notes: '',
    },
  });

  const fulfillment =
    useWatch({ control, name: 'fulfillment' }) ?? 'delivery';
  const deliveryAreaId =
    useWatch({ control, name: 'deliveryAreaId' }) ?? '';
  const transportMode =
    useWatch({ control, name: 'transportMode' }) ?? 'bike';

  const deliveryFee = resolveDeliveryFee(
    areas,
    fulfillment,
    fulfillment === 'delivery' ? deliveryAreaId : null,
    fulfillment === 'delivery' ? transportMode : null
  );

  const grandTotal = sum([subtotal, deliveryFee]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values: CheckoutFormValues) => {
      if (state.lines.length === 0) return;

      setSubmitError(null);
      submitAbortRef.current?.abort();
      const controller = new AbortController();
      submitAbortRef.current = controller;

      const orderId = `GB-${Date.now().toString(36).toUpperCase().slice(-6)}`;

      try {
        const result = await api.submitOrder(
          {
            orderId,
            createdAt: new Date().toISOString(),
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            fulfillment: values.fulfillment,
            deliveryAreaId:
              values.fulfillment === 'delivery'
                ? values.deliveryAreaId ?? null
                : null,
            transportMode:
              values.fulfillment === 'delivery' ? values.transportMode : null,
            address:
              values.fulfillment === 'delivery' ? values.address ?? null : null,
            landmark:
              values.fulfillment === 'delivery'
                ? values.landmark ?? null
                : null,
            notes: values.notes || null,
            lines: state.lines.map((l) => ({
              lineId: l.lineId,
              itemId: l.itemId,
              variantId: l.variantId,
              addOnIds: l.addOnIds,
              quantity: l.quantity,
            })),
          },
          controller.signal
        );

        setSubmissionResult(result);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSubmitError(
          'Could not prepare your WhatsApp order. Please check your details and try again.'
        );
      }
    })(e);
  };

  const handleCopyMessage = async () => {
    if (!submissionResult) return;
    try {
      await navigator.clipboard.writeText(submissionResult.messagePreview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission failure
    }
  };

  if (submissionResult) {
    return (
      <div
        role="region"
        aria-label="WhatsApp Order Ready"
        className="rounded-2xl border border-[#F8E010] bg-[#161616] p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-7 w-7 text-[#F8E010] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
              Order #{submissionResult.orderId} Ready
            </p>
            <h2 className="font-display text-3xl text-[#F8E010]">
              SEND YOUR ORDER ON WHATSAPP
            </h2>
            <p className="text-sm text-[#E6E6E6]">
              Tap the button below to open WhatsApp with your itemized order.
              Our team will reply with the account number for payment.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#101010] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#E6E6E6]/70">
            <span>WhatsApp Message Preview</span>
            <button
              type="button"
              onClick={handleCopyMessage}
              aria-label="Copy order message to clipboard"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg text-xs font-semibold text-[#F8E010] hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Message'}</span>
            </button>
          </div>
          <pre className="text-xs text-[#F8F8F8] whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
            {submissionResult.messagePreview}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={submissionResult.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#F8E010] px-6 py-3 text-base font-bold text-[#101010] hover:bg-[#F8E850] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] whitespace-nowrap shrink-0"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span>Open WhatsApp &amp; Send Order</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearCart();
              setSubmissionResult(null);
            }}
          >
            Clear Cart &amp; Start New Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-[#161616] p-6 sm:p-8 space-y-6"
    >
      <div className="space-y-1 border-b border-white/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
          WhatsApp Checkout
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-[#F8E010]">
          DELIVERY OR PICKUP DETAILS
        </h2>
      </div>

      {/* Fulfillment Type Selector (Delivery vs Pickup) */}
      <div className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-[#E6E6E6]">
          How would you like to receive your order?
        </span>
        <div
          role="radiogroup"
          aria-label="Order fulfillment method"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={fulfillment === 'delivery'}
            onClick={() =>
              setValue('fulfillment', 'delivery', { shouldValidate: true })
            }
            className={cn(
              'flex items-center justify-center gap-2 min-h-[48px] rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
              fulfillment === 'delivery'
                ? 'bg-[#F8E010] text-[#101010]'
                : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/50'
            )}
          >
            <Truck className="h-4 w-4 shrink-0" />
            <span>Delivery</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={fulfillment === 'pickup'}
            onClick={() =>
              setValue('fulfillment', 'pickup', { shouldValidate: true })
            }
            className={cn(
              'flex items-center justify-center gap-2 min-h-[48px] rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
              fulfillment === 'pickup'
                ? 'bg-[#F8E010] text-[#101010]'
                : 'bg-[#101010] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/50'
            )}
          >
            <Store className="h-4 w-4 shrink-0" />
            <span>Pickup (₦0 Fee)</span>
          </button>
        </div>
      </div>

      {fulfillment === 'pickup' ? (
        <div className="rounded-xl border border-white/10 bg-[#101010] p-4 text-sm text-[#E6E6E6] space-y-1">
          <p className="font-semibold text-[#F8E010]">
            Pickup Location — Gee&apos;s Burger Kano
          </p>
          <p>No. 32 Bompai Road, opposite Grand Square, Kano.</p>
        </div>
      ) : (
        <>
          <DeliveryAreaField
            areas={areas}
            selectedAreaId={deliveryAreaId}
            transportMode={transportMode}
            onSelectArea={(areaId) =>
              setValue('deliveryAreaId', areaId, { shouldValidate: true })
            }
            onSelectTransportMode={(mode: TransportMode) =>
              setValue('transportMode', mode, { shouldValidate: true })
            }
            errorMessage={errors.deliveryAreaId?.message}
          />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="checkout-address"
                className="block text-xs font-medium text-[#E6E6E6] mb-1.5"
              >
                Delivery Street &amp; House Address *
              </label>
              <Input
                id="checkout-address"
                placeholder="e.g. No. 14 Sultan Road, Nassarawa GRA"
                aria-invalid={Boolean(errors.address)}
                {...register('address')}
                className="bg-[#101010]"
              />
              {errors.address && (
                <p role="alert" className="mt-1 text-xs text-[#E10600]">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="checkout-landmark"
                className="block text-xs font-medium text-[#E6E6E6] mb-1.5"
              >
                Nearest Landmark (Optional)
              </label>
              <Input
                id="checkout-landmark"
                placeholder="e.g. Opposite Grand Square"
                {...register('landmark')}
                className="bg-[#101010]"
              />
            </div>
          </div>
        </>
      )}

      {/* Customer Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="checkout-name"
            className="block text-xs font-medium text-[#E6E6E6] mb-1.5"
          >
            Your Full Name *
          </label>
          <Input
            id="checkout-name"
            placeholder="Your name"
            aria-invalid={Boolean(errors.customerName)}
            {...register('customerName')}
            className="bg-[#101010]"
          />
          {errors.customerName && (
            <p role="alert" className="mt-1 text-xs text-[#E10600]">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="checkout-phone"
            className="block text-xs font-medium text-[#E6E6E6] mb-1.5"
          >
            Phone / WhatsApp Number *
          </label>
          <Input
            id="checkout-phone"
            type="tel"
            placeholder="e.g. 0803 000 0000"
            aria-invalid={Boolean(errors.customerPhone)}
            {...register('customerPhone')}
            className="bg-[#101010]"
          />
          {errors.customerPhone && (
            <p role="alert" className="mt-1 text-xs text-[#E10600]">
              {errors.customerPhone.message}
            </p>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label
          htmlFor="checkout-notes"
          className="block text-xs font-medium text-[#E6E6E6] mb-1.5"
        >
          Kitchen or Rider Note (Optional)
        </label>
        <Input
          id="checkout-notes"
          placeholder="e.g. Extra napkins, no onions on slider..."
          {...register('notes')}
          className="bg-[#101010]"
        />
      </div>

      {/* Order Totals Summary */}
      <div className="rounded-xl border border-white/10 bg-[#101010] p-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between text-[#E6E6E6]">
          <span>Items Subtotal</span>
          <span className="font-semibold text-[#F8E010] tabular-nums">
            {formatNaira(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#E6E6E6]">
          <span>
            {fulfillment === 'delivery'
              ? `Delivery Fee (${transportMode === 'car' ? 'Car' : 'Bike'})`
              : 'Pickup Fee'}
          </span>
          <span className="font-semibold text-[#F8E010] tabular-nums">
            {formatNaira(deliveryFee)}
          </span>
        </div>

        <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-base font-bold">
          <span className="text-[#F8F8F8]">Total Payable</span>
          <span className="text-xl text-[#F8E010] tabular-nums">
            {formatNaira(grandTotal)}
          </span>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="text-xs text-[#E10600]">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || state.lines.length === 0}
        className="w-full text-base font-bold"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span>
          {isSubmitting
            ? 'Preparing WhatsApp Order...'
            : `Order via WhatsApp · ${formatNaira(grandTotal)}`}
        </span>
      </Button>
    </form>
  );
}
