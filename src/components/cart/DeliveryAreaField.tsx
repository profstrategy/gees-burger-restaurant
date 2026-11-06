'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Bike, Car, ChevronDown, RotateCcw } from 'lucide-react';
import { api, type DeliveryArea, type TransportMode } from '@/lib/api';
import { formatNaira, toInt } from '@/lib/money';
import { FormField } from '@/components/common/FormField';
import { GbButton } from '@/components/ui/gb-button';
import { cn } from '@/lib/utils';

export interface DeliveryLogisticsValue {
  deliveryAreaId: string;
  vehicle: TransportMode;
  exactAddress: string;
  fee: number;
  areaName?: string;
}

export interface DeliveryAreaFieldProps {
  value: DeliveryLogisticsValue;
  onChange: (next: DeliveryLogisticsValue) => void;
  areaError?: string;
  exactAddressError?: string;
  initialAreas?: DeliveryArea[];
}

/**
 * DeliveryAreaField (standalone, not reusable, rendered only for Delivery):
 * - Area select (enabled whenever Delivery is selected; options "Bompai · Bike ₦500 · Car ₦1,000",
 *   from api.getDeliveryAreas with AbortController, loading skeleton, inline error with Retry)
 * - Bike / Car choice with two cards (stacked label on top line, fee on next line, no overlapping text)
 * - Exact Delivery Address textarea
 * - Emits {deliveryAreaId, vehicle, exactAddress, fee} upward.
 *   Vehicle fee updates immediately when area or vehicle changes.
 */
export function DeliveryAreaField({
  value,
  onChange,
  areaError,
  exactAddressError,
  initialAreas,
}: DeliveryAreaFieldProps) {
  const [areas, setAreas] = useState<DeliveryArea[]>(
    () => (initialAreas ?? []).filter((a) => a.isActive)
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialAreas || initialAreas.length === 0
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const computeFee = useCallback(
    (
      areaList: DeliveryArea[],
      areaId: string,
      vehicle: TransportMode
    ): { fee: number; areaName?: string } => {
      const found = areaList.find((a) => a.id === areaId);
      if (!found) return { fee: 0, areaName: undefined };
      const rawFee = vehicle === 'car' ? found.carFee : found.bikeFee;
      return { fee: toInt(rawFee), areaName: found.name };
    },
    []
  );

  const loadAreas = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setFetchError(null);

    api
      .getDeliveryAreas(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const active = data.filter((a) => a.isActive);
        setAreas(active);
        setIsLoading(false);

        if (value.deliveryAreaId) {
          const { fee, areaName } = computeFee(
            active,
            value.deliveryAreaId,
            value.vehicle
          );
          if (fee !== value.fee || areaName !== value.areaName) {
            onChange({
              ...value,
              fee,
              areaName,
            });
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setIsLoading(false);
        setFetchError(
          err instanceof Error
            ? err.message
            : 'Could not load Kano delivery areas.'
        );
      });
  }, [computeFee, onChange, value]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    api
      .getDeliveryAreas(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const active = data.filter((a) => a.isActive);
        setAreas(active);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setIsLoading(false);
        setFetchError(
          err instanceof Error
            ? err.message
            : 'Could not load Kano delivery areas.'
        );
      });

    return () => {
      controller.abort();
    };
  }, []);

  const selectedArea = areas.find((a) => a.id === value.deliveryAreaId);
  const bikeFeeDisplay = selectedArea
    ? formatNaira(selectedArea.bikeFee)
    : '₦0';
  const carFeeDisplay = selectedArea ? formatNaira(selectedArea.carFee) : '₦0';

  const handleAreaChange = (nextAreaId: string) => {
    const { fee, areaName } = computeFee(areas, nextAreaId, value.vehicle);
    onChange({
      ...value,
      deliveryAreaId: nextAreaId,
      fee,
      areaName,
    });
  };

  const handleVehicleChange = (nextVehicle: TransportMode) => {
    const { fee, areaName } = computeFee(
      areas,
      value.deliveryAreaId,
      nextVehicle
    );
    onChange({
      ...value,
      vehicle: nextVehicle,
      fee,
      areaName,
    });
  };

  const handleExactAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange({
      ...value,
      exactAddress: e.target.value,
    });
  };

  return (
    <section
      aria-label="Delivery logistics"
      className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 space-y-5"
    >
      <div className="space-y-1 border-b border-border-subtle pb-3">
        <h2 className="font-display text-2xl sm:text-3xl text-accent-text">
          DELIVERY LOGISTICS
        </h2>
        <p className="text-xs text-text-soft/80">
          Select your delivery area in Kano, vehicle, and exact address.
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && areas.length === 0 ? (
        <div
          aria-busy="true"
          aria-label="Loading delivery areas"
          className="space-y-4 animate-pulse"
        >
          <div className="h-11 w-full rounded-xl bg-bg border border-border-subtle" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-xl bg-bg border border-border-subtle" />
            <div className="h-20 rounded-xl bg-bg border border-border-subtle" />
          </div>
        </div>
      ) : fetchError && areas.length === 0 ? (
        /* Inline Error with Retry */
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-danger bg-danger/10 p-4 text-xs sm:text-sm text-text"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-danger shrink-0" />
            <span>{fetchError}</span>
          </div>
          <GbButton
            type="button"
            variant="ghost"
            onClick={loadAreas}
            className="shrink-0 min-h-[38px] px-3 py-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </GbButton>
        </div>
      ) : (
        <>
          {/* Area Select — always enabled when Delivery is selected */}
          <div className="space-y-1.5">
            <label
              htmlFor="delivery-area-select"
              className="block text-xs font-medium text-text-soft"
            >
              Delivery Area <span className="text-accent-text">*</span>
            </label>
            <div className="relative">
              <select
                id="delivery-area-select"
                disabled={false}
                value={value.deliveryAreaId}
                onChange={(e) => handleAreaChange(e.target.value)}
                aria-invalid={Boolean(areaError)}
                aria-describedby={
                  areaError ? 'delivery-area-select-error' : undefined
                }
                className={cn(
                  'flex min-h-[46px] w-full appearance-none rounded-xl border bg-surface px-3.5 pr-10 py-2.5 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer',
                  areaError
                    ? 'border-danger focus-visible:ring-danger'
                    : 'border-border hover:border-border-hover'
                )}
              >
                <option value="" className="bg-surface text-text-placeholder">
                  Select delivery area…
                </option>
                {areas.map((area) => (
                  <option
                    key={area.id}
                    value={area.id}
                    className="bg-surface text-text"
                  >
                    {area.name} · Bike {formatNaira(area.bikeFee)} · Car{' '}
                    {formatNaira(area.carFee)}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-text"
              />
            </div>
            {areaError && (
              <p
                id="delivery-area-select-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-danger"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger" />
                <span>{areaError}</span>
              </p>
            )}
          </div>

          {/* Bike / Car Choice with Two Cards (stacked label on top line, fee on next line, no overlapping text) */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-text-soft">
              Vehicle <span className="text-accent-text">*</span>
            </span>
            <div
              role="radiogroup"
              aria-label="Delivery vehicle choice"
              className="grid grid-cols-2 gap-3"
            >
              <button
                type="button"
                role="radio"
                aria-checked={value.vehicle === 'bike'}
                onClick={() => handleVehicleChange('bike')}
                className={cn(
                  'flex flex-col items-start justify-center gap-1.5 min-h-[72px] rounded-xl p-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  value.vehicle === 'bike'
                    ? 'bg-brand text-on-brand border-2 border-accent-text'
                    : 'bg-surface text-text border border-border hover:border-border-hover'
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider leading-tight">
                  <Bike className="h-4 w-4 shrink-0" />
                  <span>Bike</span>
                </span>
                <span className="block text-base font-extrabold tabular-nums leading-tight">
                  {bikeFeeDisplay}
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={value.vehicle === 'car'}
                onClick={() => handleVehicleChange('car')}
                className={cn(
                  'flex flex-col items-start justify-center gap-1.5 min-h-[72px] rounded-xl p-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  value.vehicle === 'car'
                    ? 'bg-brand text-on-brand border-2 border-accent-text'
                    : 'bg-surface text-text border border-border hover:border-border-hover'
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider leading-tight">
                  <Car className="h-4 w-4 shrink-0" />
                  <span>Car</span>
                </span>
                <span className="block text-base font-extrabold tabular-nums leading-tight">
                  {carFeeDisplay}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Exact Delivery Address Textarea */}
      <FormField
        id="exact-delivery-address"
        name="exactAddress"
        label="Exact Delivery Address"
        placeholder="House number, street name, gate description…"
        multiline
        rows={3}
        required
        value={value.exactAddress}
        onChange={handleExactAddressChange}
        error={exactAddressError}
      />
    </section>
  );
}

export default DeliveryAreaField;
