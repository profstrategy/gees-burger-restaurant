'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Info, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { GbButton } from '@/components/ui/gb-button';
import { Input } from '@/components/ui/input';
import { OrbitCard } from '@/components/ui/orbit-card';
import { SectionHeading } from '@/components/common/section-heading';

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  website: z.string().optional(),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export type NewsletterStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'already_subscribed'
  | 'error';

export default function NewsletterSection() {
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', website: '' },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values: NewsletterFormValues) => {
      // Hidden honeypot field: reject silently if filled
      if (values.website && values.website.trim().length > 0) {
        setStatus('idle');
        setStatusMessage(null);
        reset();
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('submitting');
      setStatusMessage(null);

      try {
        const result = await api.subscribeNewsletter(
          {
            email: values.email,
            subscribedAt: new Date().toISOString(),
          },
          controller.signal
        );

        if (result.status === 'already_subscribed') {
          setStatus('already_subscribed');
          setStatusMessage('Already subscribed.');
          return;
        }

        if (result.ok) {
          setStatus('success');
          setStatusMessage("You're in.");
          reset();
          return;
        }

        setStatus('error');
        setStatusMessage(
          result.message || 'Could not subscribe right now. Please try again.'
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStatus('error');
        setStatusMessage('Could not subscribe right now. Please try again.');
      }
    })(e);
  };

  return (
    <OrbitCard className="mx-auto max-w-3xl p-6 sm:p-10 text-center space-y-6">
      <SectionHeading
        kicker="Stay in the Loop"
        title="JOIN THE GEE'S LIST"
        subtitle="Get notified when we drop new burgers, platter specials, and seasonal shakes."
      />

      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="mx-auto max-w-lg space-y-3"
      >
        {/* Hidden honeypot field `website` — rejected silently if filled */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor="newsletter-website">Website</label>
          <input
            id="newsletter-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('website')}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
          <div className="flex-1 text-left">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              disabled={status === 'submitting'}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? 'newsletter-email-error' : undefined
              }
              {...register('email')}
              className="bg-[#161616]"
            />
            {errors.email && (
              <p
                id="newsletter-email-error"
                role="alert"
                className="mt-1.5 text-xs text-[#E10600]"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <GbButton
            type="submit"
            variant="primary"
            isLoading={status === 'submitting'}
            disabled={status === 'submitting'}
            className="sm:w-auto"
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span>
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </span>
          </GbButton>
        </div>

        <p className="text-xs text-[#E6E6E6]/80">
          By subscribing, you consent to Gee&apos;s Burger processing your email
          to send menu updates in accordance with the Nigeria Data Protection
          Act (NDPA). Unsubscribe anytime.
        </p>
      </form>

      {status !== 'idle' && status !== 'submitting' && statusMessage && (
        <div
          role={status === 'error' ? 'alert' : 'status'}
          aria-live={status === 'error' ? 'assertive' : 'polite'}
          className="pt-1"
        >
          {status === 'success' && (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#F8E010]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </p>
          )}
          {status === 'already_subscribed' && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#F8E850]">
              <Info className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </p>
          )}
          {status === 'error' && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#E10600]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </p>
          )}
        </div>
      )}
    </OrbitCard>
  );
}
