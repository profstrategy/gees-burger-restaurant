'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { api, type ReviewItem } from '@/lib/api';
import reviewsFallback from '@/data/reviews.json';

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    reviewsFallback as ReviewItem[]
  );
  const [activeIndex, setActiveIndex] = useState(0);

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

  const total = reviews.length;
  if (total === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const visibleReviews = [
    reviews[activeIndex % total],
    reviews[(activeIndex + 1) % total],
    reviews[(activeIndex + 2) % total],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
            Guest Feedback · Kano
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010] text-balance">
            WHAT GUESTS SAY ABOUT GEE&apos;S BURGER
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            aria-label="Previous review"
            onClick={handlePrev}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/15 bg-[#161616] text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-[#E6E6E6] tabular-nums">
            {activeIndex + 1} / {total}
          </span>
          <button
            type="button"
            aria-label="Next review"
            onClick={handleNext}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/15 bg-[#161616] text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {visibleReviews.map((review, idx) => (
          <article
            key={`${review.id}_${idx}`}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161616] p-6 space-y-4"
          >
            <div className="space-y-3">
              <div
                className="flex items-center gap-1"
                aria-label={`Rated ${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <Star
                    key={starIdx}
                    className={
                      starIdx < review.rating
                        ? 'h-4 w-4 fill-[#F8E010] text-[#F8E010]'
                        : 'h-4 w-4 text-[#6B6B6B]'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-[#F8F8F8] leading-relaxed whitespace-pre-line">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#E6E6E6]">
              <span className="font-semibold text-[#F8E010]">{review.name}</span>
              <span className="text-[#6B6B6B] capitalize">
                {review.source} Review
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
