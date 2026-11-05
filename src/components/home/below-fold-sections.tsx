'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { StageSection } from '@/components/ui/stage-section';

const ReviewsCarousel = dynamic(
  () => import('@/components/home/reviews-carousel'),
  {
    loading: () => (
      <div className="h-64 rounded-2xl border border-white/10 bg-[#161616] p-6 animate-pulse" />
    ),
  }
);

const FaqSection = dynamic(() => import('@/components/home/faq-section'), {
  loading: () => (
    <div className="mx-auto max-w-4xl h-72 rounded-2xl border border-white/10 bg-[#161616] p-6 animate-pulse" />
  ),
});

const NewsletterSection = dynamic(
  () => import('@/components/home/newsletter-section'),
  {
    loading: () => (
      <div className="mx-auto max-w-3xl h-48 rounded-2xl border border-white/10 bg-[#161616] p-6 animate-pulse" />
    ),
  }
);

export function BelowFoldHomeSections() {
  return (
    <>
      <StageSection
        id="reviews"
        stain="top-left"
        className="py-16 sm:py-20 border-t border-white/5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ReviewsCarousel />
        </div>
      </StageSection>

      <StageSection
        id="faq"
        stain="top-right"
        includeBottomLeftStain
        className="py-16 sm:py-20 border-t border-white/5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FaqSection />
        </div>
      </StageSection>

      <StageSection
        stain="top-left"
        className="py-16 sm:py-20 border-t border-white/5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <NewsletterSection />
        </div>
      </StageSection>
    </>
  );
}
