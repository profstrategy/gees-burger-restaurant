'use client';

import React from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  eyebrow?: string;
  align?: 'center' | 'left';
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

/**
 * SectionHeading:
 * Bebas Neue uppercase yellow title, followed by `───── ✦ ─────`.
 * On scroll-in, the two lines grow outward from the center star with a
 * horizontal fade (~600 ms), triggered once via IntersectionObserver.
 */
export function SectionHeading({
  title,
  subtitle,
  kicker,
  eyebrow,
  align = 'center',
  as: Tag = 'h2',
  className,
}: SectionHeadingProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: true,
    threshold: 0.2,
  });

  const label = kicker ?? eyebrow;

  return (
    <div
      ref={ref}
      className={cn(
        'space-y-3',
        align === 'center' ? 'text-center flex flex-col items-center' : 'text-left flex flex-col items-start',
        className
      )}
    >
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-text">
          {label}
        </p>
      )}

      <Tag className="font-display text-4xl sm:text-5xl text-accent-text leading-none tracking-wide text-balance">
        {title}
      </Tag>

      {/* Ornament: ───── ✦ ───── growing outward from the star over 600ms once on scroll-in */}
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center gap-3 w-full max-w-xs py-1',
          align === 'center' ? 'justify-center' : 'justify-start'
        )}
      >
        <span
          className={cn(
            'h-[1.5px] w-24 sm:w-28 bg-gradient-to-l from-brand to-transparent origin-right transition-all duration-[600ms] ease-out',
            inView ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
          )}
        />
        <span
          className={cn(
            'text-sm leading-none text-accent-text select-none transition-opacity duration-300',
            inView ? 'opacity-100' : 'opacity-40'
          )}
        >
          ✦
        </span>
        <span
          className={cn(
            'h-[1.5px] w-24 sm:w-28 bg-gradient-to-r from-brand to-transparent origin-left transition-all duration-[600ms] ease-out',
            inView ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
          )}
        />
      </div>

      {subtitle && (
        <p className="text-sm sm:text-base text-text-soft max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
