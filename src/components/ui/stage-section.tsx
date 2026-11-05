import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type StainPosition = 'top-left' | 'top-right' | 'none';

interface StageSectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div';
  stain?: StainPosition;
  includeBottomLeftStain?: boolean;
}

/**
 * Wraps a section in `.gb-stage` (`position:relative; isolation:isolate; overflow:hidden`)
 * and renders the brand stain overlays (`z-index:-1; pointer-events:none; position:absolute`).
 * Under 480px, `.gb-stain-secondary` is hidden so at most one stain appears per section.
 */
export function StageSection({
  as: Tag = 'section',
  stain = 'none',
  includeBottomLeftStain = false,
  className,
  children,
  ...props
}: StageSectionProps) {
  return (
    <Tag className={cn('gb-stage', className)} {...props}>
      {stain === 'top-left' && (
        <Image
          src="/brand/stains/stain-top-left.webp"
          alt=""
          width={244}
          height={474}
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="gb-stain gb-stain-top-left h-auto"
        />
      )}
      {stain === 'top-right' && (
        <Image
          src="/brand/stains/stain-top-right.webp"
          alt=""
          width={349}
          height={356}
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="gb-stain gb-stain-top-right h-auto"
        />
      )}
      {includeBottomLeftStain && (
        <Image
          src="/brand/stains/stain-bottom-left.webp"
          alt=""
          width={156}
          height={385}
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className={cn(
            'gb-stain gb-stain-bottom-left h-auto',
            stain !== 'none' && 'gb-stain-secondary'
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}
