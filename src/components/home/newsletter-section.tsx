'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export default function NewsletterSection() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values: NewsletterFormValues) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await api.subscribeNewsletter(
          {
            email: values.email,
            subscribedAt: new Date().toISOString(),
          },
          controller.signal
        );
        setIsSuccess(result.ok);
        setStatusMessage(result.message);
        if (result.ok) {
          reset();
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setIsSuccess(false);
        setStatusMessage('Could not subscribe right now. Please try again.');
      }
    })(e);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#161616] p-6 sm:p-10 text-center space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
          Stay in the Loop
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-[#F8E010] text-balance">
          GET MENU UPDATES &amp; WEEKEND SPECIALS
        </h2>
        <p className="text-sm text-[#E6E6E6] max-w-xl mx-auto">
          Sign up to hear about new burger drops, family buckets and seasonal
          platters at Gee&apos;s Burger Kano.
        </p>
      </div>

      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="mx-auto flex max-w-lg flex-col sm:flex-row items-stretch sm:items-start gap-3"
      >
        <div className="flex-1 text-left">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? 'newsletter-email-error' : undefined
            }
            {...register('email')}
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

        <Button type="submit" disabled={isSubmitting}>
          <Mail className="h-4 w-4 shrink-0" />
          <span>{isSubmitting ? 'Subscribing...' : 'Subscribe'}</span>
        </Button>
      </form>

      {statusMessage && (
        <p
          role="status"
          aria-live="polite"
          className={
            isSuccess
              ? 'inline-flex items-center gap-2 text-sm text-[#F8E010]'
              : 'text-sm text-[#E10600]'
          }
        >
          {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMessage}</span>
        </p>
      )}
    </div>
  );
}
