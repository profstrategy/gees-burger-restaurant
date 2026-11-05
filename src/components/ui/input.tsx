import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-[44px] w-full rounded-lg border border-white/15 bg-[#161616] px-4 py-2.5 text-sm text-[#F8F8F8] placeholder:text-[#6B6B6B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:border-[#F8E010] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
