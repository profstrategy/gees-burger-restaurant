'use client';

import React from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormField } from '@/components/common/FormField';

export interface CustomerDetailsFormShape {
  fullName: string;
  phone: string;
  homeAddress: string;
}

export interface CustomerDetailsSectionProps<
  T extends CustomerDetailsFormShape = CustomerDetailsFormShape
> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}

/**
 * CustomerDetailsSection: three FormFields:
 * Full Name, Phone Number, Home Address. Same for pickup and delivery.
 */
export function CustomerDetailsSection<
  T extends CustomerDetailsFormShape = CustomerDetailsFormShape
>({ register, errors }: CustomerDetailsSectionProps<T>) {
  return (
    <section
      aria-label="Customer details"
      className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 space-y-5"
    >
      <div className="space-y-1 border-b border-border-subtle pb-3">
        <h2 className="font-display text-2xl sm:text-3xl text-accent-text">
          CUSTOMER DETAILS
        </h2>
        <p className="text-xs text-text-soft/80">
          Your contact details for WhatsApp order confirmation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="customer-full-name"
          name="fullName"
          label="Full Name"
          placeholder="Your full name"
          autoComplete="name"
          maxLength={80}
          required
          register={register('fullName' as never)}
          error={errors.fullName?.message as string | undefined}
        />

        <FormField
          id="customer-phone"
          name="phone"
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="e.g. 0803 000 0000"
          required
          register={register('phone' as never)}
          error={errors.phone?.message as string | undefined}
        />
      </div>

      <FormField
        id="customer-home-address"
        name="homeAddress"
        label="Home Address"
        placeholder="e.g. No. 14 Sultan Road, Nassarawa GRA, Kano"
        autoComplete="street-address"
        maxLength={200}
        required
        register={register('homeAddress' as never)}
        error={errors.homeAddress?.message as string | undefined}
      />

      <p className="text-xs text-text-subtle leading-relaxed pt-1 border-t border-border-subtle">
        By placing an order, you consent to Gee&apos;s Burger processing your
        contact and delivery details solely to fulfil your order via WhatsApp in
        accordance with the Nigeria Data Protection Act (NDPA).
      </p>
    </section>
  );
}

export default CustomerDetailsSection;
