import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  darkClassName?: string;
  lightClassName?: string;
  priority?: boolean;
}

export function Logo({
  className,
  darkClassName,
  lightClassName,
  priority = false,
}: LogoProps) {
  // Never show the white logo on light surfaces or the black logo on dark surfaces.
  return (
    <span className={cn('inline-flex items-center', className)}>
      <Image
        src="/brand/gees-burger-logo.webp"
        alt="Gee's Burger"
        width={800}
        height={1134}
        referrerPolicy="no-referrer"
        className={cn('logo-on-dark', darkClassName)}
        priority={priority}
      />
      <Image
        src="/brand/gees-burger-logo-black.webp"
        alt="Gee's Burger"
        width={800}
        height={1134}
        referrerPolicy="no-referrer"
        className={cn('logo-on-light', lightClassName)}
        loading="lazy"
      />
    </span>
  );
}
