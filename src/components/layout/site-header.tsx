'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatNaira } from '@/lib/money';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/cart', label: 'Cart' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { totalItems, subtotal, isHydrated } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#101010]/95 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3">
        {/* Zone 1: Brand Logo on Black, min-width 120px */}
        <Link
          href="/"
          aria-label="Gee's Burger Home"
          className="inline-flex items-center gap-3 min-w-[120px] min-h-[44px] bg-[#101010] rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] shrink-0"
        >
          <Image
            src="/brand/gees-burger-logo.webp"
            alt="Gee's Burger"
            width={44}
            height={58}
            referrerPolicy="no-referrer"
            className="h-11 w-auto object-contain"
            priority
          />
          <span className="font-display text-2xl tracking-wider text-[#F8E010] whitespace-nowrap">
            GEE&apos;S BURGER
          </span>
        </Link>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href) && !link.href.includes('#');

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center min-h-[44px] px-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded-sm',
                  isActive
                    ? 'border-[#F8E010] text-[#F8E010]'
                    : 'border-transparent text-[#E6E6E6] hover:text-[#F8E010]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Cart Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cart"
            aria-label={`View Cart (${isHydrated ? totalItems : 0} items, ${
              isHydrated ? formatNaira(subtotal) : '₦0'
            })`}
            className="inline-flex items-center gap-2.5 min-h-[44px] rounded-lg bg-[#F8E010] px-4 py-2 text-sm font-bold text-[#101010] transition-colors hover:bg-[#F8E850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010] whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Cart</span>
            <span className="tabular-nums font-extrabold">
              ({isHydrated ? totalItems : 0})
            </span>
            {isHydrated && totalItems > 0 && (
              <span className="hidden sm:inline tabular-nums border-l border-[#101010]/25 pl-2">
                {formatNaira(subtotal)}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-white/15 bg-[#161616] text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-white/10 bg-[#101010] px-4 py-3 space-y-1"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href) && !link.href.includes('#');

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center min-h-[44px] px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]',
                  isActive
                    ? 'bg-[#161616] text-[#F8E010] font-semibold'
                    : 'text-[#E6E6E6] hover:bg-[#161616] hover:text-[#F8E010]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
