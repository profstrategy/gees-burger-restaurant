import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/config/site';
import { itemsById } from '@/lib/catalog-index';
import { StageSection } from '@/components/ui/stage-section';
import { GbButton } from '@/components/ui/gb-button';
import { FeaturedMenuSection } from '@/components/home/featured-menu-section';
import { BelowFoldHomeSections } from '@/components/home/below-fold-sections';

export const metadata: Metadata = {
  title: "Gee's Burger — Big Flavour, Bold Burgers in Kano",
  description:
    "Flame-grilled beef burgers, crispy fried chicken buckets, shawarma wraps and creamy shakes made fresh at No. 32 Bompai Road, Kano. Order online via WhatsApp.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Gee's Burger — Big Flavour, Bold Burgers in Kano",
    description:
      "Flame-grilled beef burgers, crispy fried chicken buckets, shawarma wraps and creamy shakes made fresh at No. 32 Bompai Road, Kano. Order online via WhatsApp.",
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  const featuredItems = siteConfig.featuredItemIds
    .map((id) => itemsById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <main className="flex-1">
      {/* 1. Hero Section */}
      <StageSection
        stain="top-right"
        className="py-12 sm:py-16 lg:py-20 border-b border-border-subtle"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-accent-text leading-[0.95] tracking-wide text-balance">
              Big flavour. Bold burgers.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-text-soft max-w-xl leading-relaxed">
              Flame-grilled beef burgers, crispy fried chicken buckets, wraps
              and creamy shakes made fresh in Kano.
            </p>

            <div className="pt-1">
              <GbButton variant="primary" size="lg" asChild>
                <Link href="/menu">
                  <span>Order now</span>
                </Link>
              </GbButton>
            </div>

            {/* Two adjacent tilted hero images clearing both top stains by >= 24px at every breakpoint */}
            <div className="relative mt-8 w-full max-w-3xl pt-8 pb-4 px-6 sm:px-12 md:px-16">
              {/* Soft yellow glow behind */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-auto h-56 w-72 sm:h-72 sm:w-[440px] rounded-full bg-brand/20 blur-3xl -z-10"
              />

              <div className="relative mx-auto flex items-center justify-center gap-2 sm:gap-6 md:gap-10">
                {/* Left: Bucket Hero — tilted +12deg and raised 24px higher */}
                <div className="gb-hero-bucket relative w-[44%] max-w-[260px] aspect-square shrink-0 select-none">
                  <Image
                    src="/images/hero/bucket-hero.webp"
                    alt="Gee's Fried Chicken Bucket"
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 640px) 42vw, 260px"
                    referrerPolicy="no-referrer"
                    className="gb-hero-shadow object-contain"
                  />
                </div>

                {/* Right: Kid's Meal Hero — tilted -12deg toward the bucket */}
                <div className="gb-hero-kids relative w-[48%] max-w-[290px] aspect-[4/3] shrink-0 select-none">
                  <Image
                    src="/images/hero/kids-meal-hero.webp"
                    alt="Gee's Burger Kid's Meal with burger, fries, and drink"
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 640px) 46vw, 290px"
                    referrerPolicy="no-referrer"
                    className="gb-hero-shadow object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </StageSection>

      {/* 2. Our Menu (siteConfig.featuredItemIds — 5 fixed items) */}
      <StageSection
        stain="top-left"
        includeBottomLeftStain
        className="py-16 sm:py-20"
      >
        <FeaturedMenuSection items={featuredItems} />
      </StageSection>

      {/* 3. FAQ (lazy), 4. Reviews (lazy), 5. Newsletter (lazy) */}
      <BelowFoldHomeSections />
    </main>
  );
}
