'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Star } from 'lucide-react';
import { api, type ReviewItem } from '@/lib/api';
import reviewsFallback from '@/data/reviews.json';
import { SectionHeading } from '@/components/common/section-heading';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { OrbitCard } from '@/components/ui/orbit-card';

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    reviewsFallback as ReviewItem[]
  );

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    const controller = new AbortController();
    api
      .getReviews(controller.signal)
      .then((data) => {
        if (data.length > 0) {
          setReviews(data);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  const autoplayPlugin = useMemo(() => {
    if (prefersReducedMotion) return [];
    return [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    ];
  }, [prefersReducedMotion]);

  if (reviews.length === 0) return null;

  return (
    <div className="space-y-8">
      <SectionHeading
        kicker="Guest Feedback"
        title="WHAT GUESTS SAY"
      />

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={autoplayPlugin}
        aria-label="Customer reviews"
        className="w-full"
      >
        <CarouselContent>
          {reviews.map((review) => (
            <CarouselItem
              key={review.id}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <OrbitCard
                as="article"
                className="flex h-full flex-col justify-between p-6 space-y-5"
              >
                <div className="space-y-3">
                  {/* Five lucide Star icons: filled yellow up to rating, outline Ash for rest, aria-label="4 out of 5 stars" */}
                  <div
                    role="img"
                    aria-label={`${review.rating} out of 5 stars`}
                    className="flex items-center gap-1"
                  >
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        aria-hidden="true"
                        className={
                          starIdx < review.rating
                            ? 'h-4 w-4 fill-[#F8E010] text-[#F8E010]'
                            : 'h-4 w-4 text-[#6B6B6B]'
                        }
                      />
                    ))}
                  </div>

                  <p className="text-sm text-[#F8F8F8] leading-relaxed whitespace-pre-line">
                    {review.text}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#F8E010]">
                    {review.name}
                  </span>
                  <span className="text-[#E6E6E6]/80">Google review</span>
                </div>
              </OrbitCard>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-6 flex items-center justify-center gap-3">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
}
