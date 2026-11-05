'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '@/state/context';
import { selectCartCount } from '@/state/selectors';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const cart = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = cart.isHydrated ? selectCartCount(cart) : 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#101010] border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 py-3">
        {/* Brand Logo on Black, min-width 120px */}
        <Link
          href="/"
          aria-label={`${siteConfig.name} Home`}
          className="inline-flex items-center gap-3 min-w-[120px] min-h-[44px] bg-[#101010] rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] shrink-0"
        >
          <Image
            src="/brand/gees-burger-logo.webp"
            alt={siteConfig.name}
            width={120}
            height={158}
            referrerPolicy="no-referrer"
            className="h-12 w-auto min-w-[36px] object-contain"
            priority
          />
          <span className="font-display text-2xl tracking-wider text-[#F8E010] whitespace-nowrap">
            GEE&apos;S BURGER
          </span>
        </Link>

        {/* Primary Navigation Links: Home / Menu */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center min-h-[44px] px-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded-sm',
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

        {/* Cart Icon with Item-Count Badge from selectCartCount */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cart"
            aria-label={`Cart (${totalItems} ${
              totalItems === 1 ? 'item' : 'items'
            })`}
            className="relative inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] rounded-xl border border-[#F8E010]/60 bg-[#161616] px-3.5 py-2 text-sm font-semibold text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <ShoppingBag className="h-5 w-5 text-[#F8E010] shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            <span
              data-testid="header-cart-badge"
              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F8E010] px-1.5 text-xs font-extrabold text-[#101010] tabular-nums"
            >
              {totalItems}
            </span>
          </Link>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/15 bg-[#161616] text-[#F8F8F8] hover:border-[#F8E010] hover:text-[#F8E010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
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
                : pathname.startsWith(link.href);

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
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between min-h-[44px] px-3 rounded-lg text-sm font-medium text-[#E6E6E6] hover:bg-[#161616] hover:text-[#F8E010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
          >
            <span>Cart</span>
            <span className="rounded-full bg-[#F8E010] px-2 py-0.5 text-xs font-bold text-[#101010] tabular-nums">
              {totalItems}
            </span>
          </Link>
        </nav>
      )}
    </header>
  );
}
