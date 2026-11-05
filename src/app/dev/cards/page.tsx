import React from 'react';
import { StageSection } from '@/components/ui/stage-section';
import { DevCardsShowcase } from '@/components/menu/dev-cards-showcase';

export default function DevCardsPage() {
  return (
    <main className="flex-1">
      <StageSection
        stain="top-left"
        includeBottomLeftStain
        className="py-12 sm:py-16 min-h-[85vh]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DevCardsShowcase />
        </div>
      </StageSection>
    </main>
  );
}
