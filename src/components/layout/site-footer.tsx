import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Instagram } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/common/Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg text-text-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Link
              href="/"
              aria-label={`${siteConfig.name} Home`}
              className="inline-flex min-h-[44px] min-w-[120px] items-center gap-3 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Logo
                darkClassName="h-auto w-[120px] min-w-[120px] object-contain"
                lightClassName="h-auto w-[120px] min-w-[120px] object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-text-soft/80">
              {siteConfig.name} — Freshly grilled burgers, sliders, crispy fried
              chicken, shawarma, platters, and shakes in Kano.
            </p>
          </div>

          {/* 2. Navigation Links: Home / Menu / Cart */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-accent-text">NAVIGATION</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center rounded text-text-soft transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className="inline-flex min-h-[44px] items-center rounded text-text-soft transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="inline-flex min-h-[44px] items-center rounded text-text-soft transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. NAP (Name, Address, Phone) from config/site.ts */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-accent-text">
              {siteConfig.name}
            </h2>
            <address className="not-italic space-y-2 text-sm text-text-soft">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent-text" />
                <span>{siteConfig.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent-text" />
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex min-h-[44px] items-center rounded transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {siteConfig.phone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 shrink-0 text-accent-text" />
                <span>@{siteConfig.socialHandle}</span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-6 text-xs text-text-soft/80 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>
            {siteConfig.address} · {siteConfig.phone}
          </p>
        </div>
      </div>
    </footer>
  );
}
