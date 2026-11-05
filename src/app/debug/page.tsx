import React from 'react';
import { StageSection } from '@/components/ui/stage-section';
import { StateDebugPanel } from '@/components/feedback/state-debug-panel';

export default function DebugPage() {
  return (
    <main className="flex-1">
      <StageSection
        stain="top-right"
        includeBottomLeftStain
        className="py-14 sm:py-20 min-h-[80vh]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StateDebugPanel />
        </div>
      </StageSection>
    </main>
  );
}
