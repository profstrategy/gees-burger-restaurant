'use client';

import React from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

export interface OrbitCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section';
}

/**
 * Orbiting border card (.gb-orbit) that sets `data-inview="true"` when visible
 * in the viewport via IntersectionObserver and pauses the animation when off-screen.
 */
export function OrbitCard({
  as: Tag = 'div',
  className,
  children,
  ...props
}: OrbitCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    threshold: 0.05,
  });

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-inview={inView ? 'true' : 'false'}
      className={cn('gb-orbit', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
