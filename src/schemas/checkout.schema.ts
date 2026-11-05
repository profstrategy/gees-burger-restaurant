import { z } from 'zod';

/**
 * Strips spaces, dashes, parentheses, and a leading '+' from a raw phone string.
 */
export function stripPhoneFormatting(raw: string): string {
  return raw
    .trim()
    .replace(/[\s\-()]/g, '')
    .replace(/^\+/, '');
}

/**
 * Validates Nigerian mobile numbers after stripping spaces, dashes, and leading '+':
 * Matches ^(234|0)[789]\d{9}$
 */
export const NIGERIAN_MOBILE_REGEX = /^(234|0)[789]\d{9}$/;

export function isValidNigerianPhone(raw: string): boolean {
  return NIGERIAN_MOBILE_REGEX.test(stripPhoneFormatting(raw));
}

/**
 * Normalises a valid Nigerian mobile number to '234...' (e.g. '08031234567' -> '2348031234567').
 */
export function normalizeNigerianPhone(raw: string): string {
  const stripped = stripPhoneFormatting(raw);
  if (stripped.startsWith('0') && stripped.length === 11) {
    return `234${stripped.slice(1)}`;
  }
  return stripped;
}

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(80, 'Full name must be 80 characters or fewer');

export const nigerianPhoneSchema = z
  .string()
  .trim()
  .refine(isValidNigerianPhone, {
    message:
      'Enter a valid Nigerian mobile number (e.g. 0803 123 4567 or +234 803 123 4567)',
  })
  .transform(normalizeNigerianPhone);

export const homeAddressSchema = z
  .string()
  .trim()
  .min(5, 'Home address must be at least 5 characters')
  .max(200, 'Home address must be 200 characters or fewer');

export const exactAddressSchema = z
  .string()
  .trim()
  .min(5, 'Exact delivery address must be at least 5 characters')
  .max(200, 'Exact delivery address must be 200 characters or fewer');

const commonCheckoutFields = {
  fullName: fullNameSchema,
  phone: nigerianPhoneSchema,
  homeAddress: homeAddressSchema,
};

export const pickupCheckoutSchema = z.object({
  deliveryType: z.literal('pickup'),
  ...commonCheckoutFields,
});

export const deliveryCheckoutSchema = z.object({
  deliveryType: z.literal('delivery'),
  ...commonCheckoutFields,
  deliveryAreaId: z
    .string()
    .trim()
    .min(1, 'Please select a delivery area in Kano'),
  vehicle: z.enum(['bike', 'car']),
  exactAddress: exactAddressSchema,
});

/**
 * Shared discriminated union checkout schema (used on client and future server route).
 */
export const checkoutSchema = z.discriminatedUnion('deliveryType', [
  pickupCheckoutSchema,
  deliveryCheckoutSchema,
]);

export type PickupCheckoutInput = z.input<typeof pickupCheckoutSchema>;
export type DeliveryCheckoutInput = z.input<typeof deliveryCheckoutSchema>;
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutPayload = z.output<typeof checkoutSchema>;

/**
 * Form-binding schema for react-hook-form (allows initial null deliveryType before user chooses,
 * while validating all fields and enforcing discriminated rules on submit/blur/change).
 */
export const checkoutFormSchema = z
  .object({
    deliveryType: z.enum(['pickup', 'delivery']).nullable(),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name must be 80 characters or fewer'),
    phone: z
      .string()
      .trim()
      .refine(isValidNigerianPhone, {
        message:
          'Enter a valid Nigerian mobile number (e.g. 0803 123 4567 or +234 803 123 4567)',
      }),
    homeAddress: z
      .string()
      .trim()
      .min(5, 'Home address must be at least 5 characters')
      .max(200, 'Home address must be 200 characters or fewer'),
    deliveryAreaId: z.string().optional(),
    vehicle: z.enum(['bike', 'car']),
    exactAddress: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.deliveryType === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryType'],
        message: 'Please choose Pickup or Delivery to continue.',
      });
      return;
    }

    if (values.deliveryType === 'delivery') {
      if (!values.deliveryAreaId || values.deliveryAreaId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deliveryAreaId'],
          message: 'Please select a delivery area in Kano',
        });
      }
      const trimmedExact = (values.exactAddress ?? '').trim();
      if (trimmedExact.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exactAddress'],
          message: 'Exact delivery address must be at least 5 characters',
        });
      } else if (trimmedExact.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exactAddress'],
          message: 'Exact delivery address must be 200 characters or fewer',
        });
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
