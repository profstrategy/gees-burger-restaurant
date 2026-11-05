import React from 'react';
import { StageSection } from '@/components/ui/stage-section';
import { FoundationShowcase } from '@/components/feedback/catalog-validation-status';
import { StateDebugPanel } from '@/components/feedback/state-debug-panel';

export default function FoundationPage() {
  return (
    <main className="flex-1">
      <StageSection
        stain="top-left"
        includeBottomLeftStain
        className="py-14 sm:py-20 min-h-[80vh]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <FoundationShowcase />
          <StateDebugPanel />
        </div>
      </StageSection>
    </main>
  );
}
