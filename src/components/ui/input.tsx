import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-[44px] w-full rounded-xl border border-[#6B6B6B] bg-[#161616] px-3.5 py-2.5 text-sm text-[#F8F8F8] placeholder:text-[#9A9A9A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:border-[#F8E010] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#E10600]',
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
