import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010] disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-5 py-2.5 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#F8E010] text-[#101010] hover:bg-[#F8E850] active:bg-[#e5cd09]',
        outline:
          'border border-[#F8E010]/40 bg-[#161616] text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010]',
        secondary:
          'bg-[#161616] text-[#F8F8F8] border border-white/10 hover:border-white/25 hover:bg-white/5',
        ghost:
          'text-[#E6E6E6] hover:bg-white/5 hover:text-[#F8E010]',
        destructive:
          'bg-[#E10600] text-[#F8F8F8] hover:bg-[#E10600]/90',
      },
      size: {
        default: 'min-h-[44px] px-5 py-2.5',
        sm: 'min-h-[44px] px-3.5 py-2 text-xs',
        lg: 'min-h-[48px] px-7 py-3 text-base',
        icon: 'min-h-[44px] min-w-[44px] p-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
