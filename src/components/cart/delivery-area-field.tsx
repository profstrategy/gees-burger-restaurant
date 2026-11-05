'use client';

import React from 'react';
import { Bike, Car, MapPin } from 'lucide-react';
import type { DeliveryArea, TransportMode } from '@/lib/api/types';
import { formatNaira } from '@/lib/money';
import { cn } from '@/lib/utils';

interface DeliveryAreaFieldProps {
  areas: DeliveryArea[];
  selectedAreaId: string;
  transportMode: TransportMode;
  onSelectArea: (areaId: string) => void;
  onSelectTransportMode: (mode: TransportMode) => void;
  errorMessage?: string;
}

export default function DeliveryAreaField({
  areas,
  selectedAreaId,
  transportMode,
  onSelectArea,
  onSelectTransportMode,
  errorMessage,
}: DeliveryAreaFieldProps) {
  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#101010] p-4">
      <div className="space-y-2">
        <label
          htmlFor="delivery-area-select"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8E010]"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span>Kano Delivery Area *</span>
        </label>

        <select
          id="delivery-area-select"
          value={selectedAreaId}
          onChange={(e) => onSelectArea(e.target.value)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? 'delivery-area-error' : undefined}
          className="flex min-h-[44px] w-full rounded-lg border border-white/15 bg-[#161616] px-3.5 py-2.5 text-sm text-[#F8F8F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] cursor-pointer"
        >
          <option value="">Select your area in Kano...</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} — Bike: {formatNaira(area.bikeFee)} / Car:{' '}
              {formatNaira(area.carFee)}
            </option>
          ))}
        </select>

        {errorMessage && (
          <p
            id="delivery-area-error"
            role="alert"
            className="text-xs text-[#E10600]"
          >
            {errorMessage}
          </p>
        )}
      </div>

      {/* Bike vs Car Rider Selection */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#E6E6E6]">
          Delivery Rider Option:
        </span>
        <div
          role="radiogroup"
          aria-label="Delivery rider transport mode"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={transportMode === 'bike'}
            aria-label={`Bike delivery (${
              selectedArea ? formatNaira(selectedArea.bikeFee) : 'Select area'
            })`}
            onClick={() => onSelectTransportMode('bike')}
            className={cn(
              'flex items-center justify-between gap-2 min-h-[44px] rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
              transportMode === 'bike'
                ? 'bg-[#F8E010] text-[#101010]'
                : 'bg-[#161616] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Bike className="h-4 w-4 shrink-0" />
              <span>By Bike</span>
            </span>
            <span className="tabular-nums font-bold">
              {selectedArea ? formatNaira(selectedArea.bikeFee) : '—'}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={transportMode === 'car'}
            aria-label={`Car delivery (${
              selectedArea ? formatNaira(selectedArea.carFee) : 'Select area'
            })`}
            onClick={() => onSelectTransportMode('car')}
            className={cn(
              'flex items-center justify-between gap-2 min-h-[44px] rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
              transportMode === 'car'
                ? 'bg-[#F8E010] text-[#101010]'
                : 'bg-[#161616] text-[#E6E6E6] border border-white/15 hover:border-[#F8E010]/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-4 w-4 shrink-0" />
              <span>By Car</span>
            </span>
            <span className="tabular-nums font-bold">
              {selectedArea ? formatNaira(selectedArea.carFee) : '—'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
