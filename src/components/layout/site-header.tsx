'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '@/state/context';
import { selectCartCount } from '@/state/selectors';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-3 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${siteConfig.name} Home`}
          className="inline-flex min-h-[44px] min-w-[120px] shrink-0 items-center gap-3 rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Logo
            className="shrink-0"
            darkClassName="h-12 w-auto min-w-[36px] object-contain"
            lightClassName="h-12 w-auto min-w-[36px] object-contain"
            priority
          />
          <span className="max-[360px]:hidden whitespace-nowrap font-display text-2xl tracking-wider text-accent-text">
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
                  'inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-sm border-b-2 px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  isActive
                    ? 'border-accent-text text-accent-text'
                    : 'border-transparent text-text-soft hover:text-accent-text'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Cart Icon with Item-Count Badge from selectCartCount */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/cart"
            aria-label={`Cart (${totalItems} ${
              totalItems === 1 ? 'item' : 'items'
            })`}
            className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:border-accent-text hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring max-[360px]:gap-1 max-[360px]:px-2"
          >
            <ShoppingBag className="h-5 w-5 shrink-0 text-accent-text" />
            <span className="hidden sm:inline">Cart</span>
            <span
              data-testid="header-cart-badge"
              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-xs font-extrabold tabular-nums text-on-brand"
            >
              {totalItems}
            </span>
          </Link>

          <ThemeToggle />

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-surface text-text hover:border-accent-text hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring md:hidden"
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
          className="space-y-1 border-t border-border-subtle bg-bg px-4 py-3 md:hidden"
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
                  'flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  isActive
                    ? 'bg-surface text-accent-text font-semibold'
                    : 'text-text-soft hover:bg-surface hover:text-accent-text'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex min-h-[44px] items-center justify-between rounded-lg px-3 text-sm font-medium text-text-soft hover:bg-surface hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>Cart</span>
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold tabular-nums text-on-brand">
              {totalItems}
            </span>
          </Link>
        </nav>
      )}
    </header>
  );
}
