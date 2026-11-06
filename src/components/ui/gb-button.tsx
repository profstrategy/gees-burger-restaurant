'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GbButtonVariant = 'primary' | 'ghost';
export type GbButtonSize = 'sm' | 'md' | 'lg';

export interface GbButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GbButtonVariant;
  size?: GbButtonSize;
  loading?: boolean;
  isLoading?: boolean;
  asChild?: boolean;
}

const sizeClasses: Record<GbButtonSize, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-xs',
  md: 'min-h-[44px] px-5 py-2.5 text-sm',
  lg: 'min-h-[48px] px-7 py-3 text-base',
};

/**
 * Branded button variants retain a fixed dark base and wipe to the brand fill.
 * - Includes loading and disabled states
 */
export const GbButton = React.forwardRef<HTMLButtonElement, GbButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      isLoading = false,
      disabled = false,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const busy = loading || isLoading;
    const isDisabled = disabled || busy;
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-busy={busy || undefined}
        data-variant={variant}
        className={cn(
          'gb-btn',
          variant === 'ghost' ? 'gb-btn-ghost' : 'gb-btn-primary',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {busy && (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin"
              />
            )}
            <span>{children}</span>
          </span>
        )}
      </Comp>
    );
  }
);

GbButton.displayName = 'GbButton';
