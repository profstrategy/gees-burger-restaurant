'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { MenuItem } from '@/types/catalog';
import { catalogIndex } from '@/lib/catalog-index';
import { useMenuCardModel } from '@/hooks/useMenuCardModel';
import { MenuCard } from '@/components/menu/MenuCard/MenuCard';
import { SectionHeading } from '@/components/common/section-heading';

interface FeaturedMenuCardItemProps {
  item: MenuItem;
  priority: boolean;
}

function FeaturedMenuCardItem({ item, priority }: FeaturedMenuCardItemProps) {
  const model = useMenuCardModel(item, catalogIndex);
  return <MenuCard model={model} priority={priority} className="h-full" />;
}

export interface FeaturedMenuSectionProps {
  items: MenuItem[];
}

export function FeaturedMenuSection({ items }: FeaturedMenuSectionProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
      <SectionHeading title="OUR MENU" />

      {/* Mobile snap carousel -> Desktop grid */}
      <div
        role="region"
        aria-label="Featured menu items"
        className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="w-[85vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink"
          >
            <FeaturedMenuCardItem item={item} priority={idx < 3} />
          </div>
        ))}
      </div>

      {/* Yellow "See more" button to /menu */}
      <div className="flex justify-center pt-2">
        <Link
          href="/menu"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-brand px-8 py-3 text-sm sm:text-base font-bold text-on-brand hover:bg-brand-splash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg whitespace-nowrap shrink-0"
        >
          <span>See more</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
