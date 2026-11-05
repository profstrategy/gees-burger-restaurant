'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { type FieldErrors, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import deliveryAreasFallback from '@/data/delivery-areas.json';
import {
  type DeliveryArea,
  type FulfillmentType,
  type OrderSubmissionPayload,
} from '@/lib/api';
import { getCatalogIndex } from '@/lib/catalog-index';
import { sum } from '@/lib/money';
import {
  checkoutFormSchema,
  checkoutSchema,
  normalizeNigerianPhone,
  type CheckoutFormValues,
} from '@/schemas/checkout.schema';
import { useSubmitOrder } from '@/hooks/useSubmitOrder';
import { actions } from '@/state/actions';
import {
  findCatalogConflictsForCartLines,
  useCart,
  useDispatch,
} from '@/state/context';
import { selectCartCount, selectCartTotal } from '@/state/selectors';
import { SectionHeading } from '@/components/common/section-heading';
import { CartLineList } from '@/components/cart/CartLineList';
import { CustomerDetailsSection } from '@/components/cart/CustomerDetailsSection';
import {
  DeliveryAreaField,
  type DeliveryLogisticsValue,
} from '@/components/cart/DeliveryAreaField';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { FulfillmentToggle } from '@/components/cart/FulfillmentToggle';
import { OrderSuccessPanel } from '@/components/cart/OrderSuccessPanel';
import { OrderSummaryCard } from '@/components/cart/OrderSummaryCard';
import { StockConflictBanner } from '@/components/cart/StockConflictBanner';
import { WhatsAppPreview } from '@/components/cart/WhatsAppPreview';

export { checkoutFormSchema as customerDetailsSchema };
export type { CheckoutFormValues as CustomerDetailsFormValues };

const CHECKOUT_FORM_ID = 'gees-checkout-form';

const FIELD_DOM_ID_MAP: Record<string, string> = {
  fullName: 'customer-full-name',
  phone: 'customer-phone',
  homeAddress: 'customer-home-address',
  deliveryAreaId: 'delivery-area-select',
  exactAddress: 'exact-delivery-address',
};

export function CartPage() {
  const cart = useCart();
  const dispatch = useDispatch();

  const [catalogIdx, setCatalogIdx] = useState(() => getCatalogIndex());

  const totalItems = selectCartCount(cart);
  const subtotal = selectCartTotal(cart, catalogIdx);

  const detectedCatalogConflicts = useMemo(
    () => findCatalogConflictsForCartLines(cart.lines, catalogIdx),
    [cart.lines, catalogIdx]
  );

  // Sync any newly detected stock_out conflicts into state.cart.conflicts
  useEffect(() => {
    const newKeys = Object.keys(detectedCatalogConflicts).filter(
      (k) => !(k in cart.conflicts)
    );
    if (newKeys.length > 0) {
      dispatch(
        actions.cart.setConflicts({
          ...cart.conflicts,
          ...detectedCatalogConflicts,
        })
      );
    }
  }, [cart.conflicts, detectedCatalogConflicts, dispatch]);

  const effectiveConflicts = useMemo(
    () => ({
      ...detectedCatalogConflicts,
      ...cart.conflicts,
    }),
    [cart.conflicts, detectedCatalogConflicts]
  );

  const hasConflicts = Object.keys(effectiveConflicts).length > 0;

  // Delivery logistics fee & areaName emitted upward by DeliveryAreaField
  const [deliveryFeeState, setDeliveryFeeState] = useState<{
    fee: number;
    areaName?: string;
  }>({
    fee: 0,
    areaName: undefined,
  });

  const activeAreas = useMemo(
    () => (deliveryAreasFallback as DeliveryArea[]).filter((a) => a.isActive),
    []
  );

  // react-hook-form + zodResolver: validate on blur, then on change after first error; focus first invalid field on submit
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      deliveryType: null,
      fullName: '',
      phone: '',
      homeAddress: '',
      deliveryAreaId: '',
      vehicle: 'bike',
      exactAddress: '',
    },
  });

  const handleServerValidationErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (
          field === 'fullName' ||
          field === 'phone' ||
          field === 'homeAddress' ||
          field === 'deliveryAreaId' ||
          field === 'exactAddress' ||
          field === 'deliveryType'
        ) {
          setError(field, { type: 'server', message });
        }
      }
    },
    [setError]
  );

  const handleCatalogRefresh = useCallback(() => {
    setCatalogIdx(getCatalogIndex());
  }, [setCatalogIdx]);

  const {
    submit: submitOrder,
    retry: retryOrder,
    reset: resetOrder,
    idempotencyKey,
    isSubmitting: isSubmittingOrder,
    result: submissionResult,
    error: submitError,
  } = useSubmitOrder({
    onValidationErrors: handleServerValidationErrors,
    onCatalogRefresh: handleCatalogRefresh,
  });

  const deliveryType =
    useWatch({ control, name: 'deliveryType' }) ?? null;
  const fullName = useWatch({ control, name: 'fullName' }) ?? '';
  const phone = useWatch({ control, name: 'phone' }) ?? '';
  const homeAddress = useWatch({ control, name: 'homeAddress' }) ?? '';
  const deliveryAreaId =
    useWatch({ control, name: 'deliveryAreaId' }) ?? '';
  const vehicle = useWatch({ control, name: 'vehicle' }) ?? 'bike';
  const exactAddress =
    useWatch({ control, name: 'exactAddress' }) ?? '';

  const effectiveDeliveryFee =
    deliveryType === 'delivery' ? deliveryFeeState.fee : 0;
  const grandTotal = sum([subtotal, effectiveDeliveryFee]);

  // Shared OrderSubmissionPayload used by BOTH WhatsAppPreview and createOrder
  // Note: preview passes orderId: 'PREVIEW' so until the order exists the preview shows "Order ref: (assigned on send)."
  const previewOrderPayload = useMemo<OrderSubmissionPayload>(
    () => ({
      orderId: submissionResult?.orderId ?? 'PREVIEW',
      createdAt: '',
      customerName: fullName.trim() || 'Customer',
      customerPhone: phone.trim()
        ? normalizeNigerianPhone(phone)
        : '—',
      homeAddress: homeAddress.trim() || null,
      fulfillment: deliveryType ?? 'pickup',
      deliveryAreaId:
        deliveryType === 'delivery' ? deliveryAreaId || null : null,
      transportMode: deliveryType === 'delivery' ? vehicle : null,
      address:
        deliveryType === 'delivery'
          ? exactAddress.trim() || homeAddress.trim() || null
          : homeAddress.trim() || null,
      exactAddress:
        deliveryType === 'delivery' ? exactAddress.trim() || null : null,
      landmark: null,
      notes: null,
      lines: cart.lines.map((l) => ({
        lineId: l.key,
        itemId: l.itemId,
        variantId: l.variantId,
        addOnIds: l.addOns.map((a) => a.addOnId),
        addOns: l.addOns,
        quantity: l.qty,
      })),
    }),
    [
      cart.lines,
      deliveryAreaId,
      deliveryType,
      exactAddress,
      fullName,
      homeAddress,
      phone,
      submissionResult?.orderId,
      vehicle,
    ]
  );

  const focusFirstInvalidField = useCallback(
    (fieldErrors: FieldErrors<CheckoutFormValues>) => {
      if (typeof document === 'undefined') return;
      const order: Array<keyof CheckoutFormValues> = [
        'deliveryType',
        'fullName',
        'phone',
        'homeAddress',
        'deliveryAreaId',
        'exactAddress',
      ];
      for (const key of order) {
        if (fieldErrors[key]) {
          const domId = FIELD_DOM_ID_MAP[key];
          const el = domId
            ? document.getElementById(domId)
            : document.querySelector<HTMLElement>(
                '[aria-label="Choose Pickup or Delivery"] button'
              );
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
            break;
          }
        }
      }
    },
    []
  );

  const executeValidOrderSubmit = useCallback(
    async (values: CheckoutFormValues) => {
      if (cart.lines.length === 0 || hasConflicts) return;
      if (!values.deliveryType) return;

      // Validate through the shared discriminatedUnion checkoutSchema (normalising phone to 234...)
      const parsed = checkoutSchema.safeParse(
        values.deliveryType === 'delivery'
          ? {
              deliveryType: 'delivery',
              fullName: values.fullName,
              phone: values.phone,
              homeAddress: values.homeAddress,
              deliveryAreaId: values.deliveryAreaId ?? '',
              vehicle: values.vehicle,
              exactAddress: values.exactAddress ?? '',
            }
          : {
              deliveryType: 'pickup',
              fullName: values.fullName,
              phone: values.phone,
              homeAddress: values.homeAddress,
            }
      );

      if (!parsed.success) return;

      const validated = parsed.data;

      await submitOrder({
        orderId: idempotencyKey,
        idempotencyKey,
        createdAt: new Date().toISOString(),
        customerName: validated.fullName,
        customerPhone: validated.phone,
        homeAddress: validated.homeAddress,
        fulfillment: validated.deliveryType,
        deliveryAreaId:
          validated.deliveryType === 'delivery'
            ? validated.deliveryAreaId
            : null,
        transportMode:
          validated.deliveryType === 'delivery' ? validated.vehicle : null,
        address:
          validated.deliveryType === 'delivery'
            ? validated.exactAddress
            : validated.homeAddress,
        exactAddress:
          validated.deliveryType === 'delivery'
            ? validated.exactAddress
            : null,
        landmark: null,
        notes: null,
        lines: cart.lines.map((l) => ({
          lineId: l.key,
          itemId: l.itemId,
          variantId: l.variantId,
          addOnIds: l.addOns.map((a) => a.addOnId),
          addOns: l.addOns,
          quantity: l.qty,
        })),
      });
    },
    [cart.lines, hasConflicts, idempotencyKey, submitOrder]
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit(executeValidOrderSubmit, focusFirstInvalidField)(e);
  };

  useEffect(() => {
    const onRetry = () => {
      void handleSubmit(executeValidOrderSubmit, focusFirstInvalidField)();
    };
    window.addEventListener('gees:retry-submit', onRetry);
    return () => window.removeEventListener('gees:retry-submit', onRetry);
  }, [executeValidOrderSubmit, focusFirstInvalidField, handleSubmit]);

  const handleFulfillmentChange = (next: FulfillmentType) => {
    setValue('deliveryType', next, { shouldValidate: true });
    clearErrors('deliveryType');
  };

  const handleDeliveryLogisticsChange = (next: DeliveryLogisticsValue) => {
    setValue('deliveryAreaId', next.deliveryAreaId, {
      shouldDirty: true,
      shouldValidate: Boolean(errors.deliveryAreaId),
    });
    setValue('vehicle', next.vehicle, {
      shouldDirty: true,
    });
    setValue('exactAddress', next.exactAddress, {
      shouldDirty: true,
      shouldValidate: Boolean(errors.exactAddress),
    });
    setDeliveryFeeState({
      fee: next.fee,
      areaName: next.areaName,
    });
  };

  return (
    <div className="pb-28 lg:pb-16">
      {/* Top title header with small outer-gutter stains only above the title (>= 24px clearance, never behind banner, form, or summary) */}
      <div className="gb-stage pt-12 pb-6 sm:pt-16 sm:pb-8">
        <Image
          src="/brand/stains/stain-top-left.webp"
          alt=""
          aria-hidden="true"
          width={244}
          height={474}
          referrerPolicy="no-referrer"
          className="gb-stain pointer-events-none select-none top-0 left-0 !w-[clamp(64px,10vw,120px)] max-h-[110px] object-cover object-top opacity-80"
        />
        <Image
          src="/brand/stains/stain-top-right.webp"
          alt=""
          aria-hidden="true"
          width={349}
          height={356}
          referrerPolicy="no-referrer"
          className="gb-stain gb-stain--secondary pointer-events-none select-none top-0 right-0 !w-[clamp(72px,12vw,140px)] max-h-[110px] object-cover object-top opacity-80"
        />

        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-8">
          {/* 1. Title: SectionHeading "YOUR CART" */}
          <SectionHeading as="h1" title="YOUR CART" align="left" />
        </div>
      </div>

      {/* Main Cart Content — zero stains behind banner, line list, form, summary, or toasts */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
        {/* EmptyCart shown ONLY after hydration with zero lines (and no active OrderSuccessPanel) */}
        {cart.isHydrated && cart.lines.length === 0 && !submissionResult ? (
          <EmptyCart />
        ) : (
          /* Desktop >= 1024px: two columns (~60 / 40), OrderSummaryCard sticky in right column.
             Mobile: single column, OrderSummaryCard after the form + sticky bottom bar. */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (~60%): StockConflictBanner -> CartLineList -> FulfillmentToggle -> CustomerDetailsSection -> DeliveryAreaField -> WhatsAppPreview */}
            <div className="lg:col-span-7 space-y-6">
              {/* 2. StockConflictBanner */}
              <StockConflictBanner conflicts={effectiveConflicts} />

              {/* 3. CartLineList (shows CartLineSkeleton while !isHydrated) */}
              {!submissionResult && <CartLineList />}

              {/* Mutually exclusive: OrderSuccessPanel replaces the form area after success */}
              {submissionResult ? (
                <OrderSuccessPanel
                  result={submissionResult}
                  onReset={() => {
                    dispatch(actions.cart.clear());
                    resetOrder();
                  }}
                />
              ) : (
                <form
                  id={CHECKOUT_FORM_ID}
                  onSubmit={handleFormSubmit}
                  noValidate
                  className="space-y-6"
                >
                  {/* 4. FulfillmentToggle */}
                  <FulfillmentToggle
                    value={deliveryType}
                    onChange={handleFulfillmentChange}
                    error={errors.deliveryType?.message}
                  />

                  {/* 5. CustomerDetailsSection */}
                  <CustomerDetailsSection
                    register={register}
                    errors={errors}
                  />

                  {/* 6. DeliveryAreaField (delivery only) */}
                  {deliveryType === 'delivery' && (
                    <DeliveryAreaField
                      value={{
                        deliveryAreaId,
                        vehicle,
                        exactAddress,
                        fee: deliveryFeeState.fee,
                        areaName: deliveryFeeState.areaName,
                      }}
                      onChange={handleDeliveryLogisticsChange}
                      areaError={errors.deliveryAreaId?.message}
                      exactAddressError={errors.exactAddress?.message}
                      initialAreas={activeAreas}
                    />
                  )}

                  {/* 7. WhatsAppPreview */}
                  <WhatsAppPreview
                    payload={previewOrderPayload}
                    areas={activeAreas}
                  />
                </form>
              )}
            </div>

            {/* Right Column (~40%): OrderSummaryCard sticky in right column on >= 1024px; after the form on mobile */}
            {!submissionResult && (
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <OrderSummaryCard
                  itemCount={totalItems}
                  subtotal={subtotal}
                  deliveryFee={effectiveDeliveryFee}
                  total={grandTotal}
                  fulfillment={deliveryType}
                  vehicle={vehicle}
                  areaName={deliveryFeeState.areaName}
                  isSubmitting={isSubmittingOrder}
                  hasConflicts={hasConflicts}
                  submitError={submitError}
                  formId={CHECKOUT_FORM_ID}
                  onRetrySubmit={retryOrder}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
