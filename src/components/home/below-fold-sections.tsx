'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { StageSection } from '@/components/ui/stage-section';

const FaqSection = dynamic(() => import('@/components/home/faq-section'), {
  loading: () => (
    <div className="mx-auto max-w-4xl h-72 rounded-2xl border border-border-subtle bg-surface p-6 animate-pulse" />
  ),
});

const ReviewsCarousel = dynamic(
  () => import('@/components/home/reviews-carousel'),
  {
    loading: () => (
      <div className="h-64 rounded-2xl border border-border-subtle bg-surface p-6 animate-pulse" />
    ),
  }
);

const NewsletterSection = dynamic(
  () => import('@/components/home/newsletter-section'),
  {
    loading: () => (
      <div className="mx-auto max-w-3xl h-48 rounded-2xl border border-border-subtle bg-surface p-6 animate-pulse" />
    ),
  }
);

export function BelowFoldHomeSections() {
  return (
    <>
      {/* 3. FAQ (lazy) */}
      <StageSection
        id="faq"
        stain="top-right"
        includeBottomLeftStain
        className="py-16 sm:py-20 border-t border-border-subtle"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FaqSection />
        </div>
      </StageSection>

      {/* 4. Reviews (lazy) */}
      <StageSection
        id="reviews"
        stain="top-left"
        className="py-16 sm:py-20 border-t border-border-subtle"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ReviewsCarousel />
        </div>
      </StageSection>

      {/* 5. Newsletter (lazy) */}
      <StageSection
        id="newsletter"
        stain="top-right"
        className="py-16 sm:py-20 border-t border-border-subtle"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <NewsletterSection />
        </div>
      </StageSection>
    </>
  );
}
