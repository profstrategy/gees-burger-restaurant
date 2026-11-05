import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Instagram } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="bg-[#101010] border-t border-white/10 text-[#E6E6E6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* 1. Brand Logo on Black (min-width 120px) */}
          <div className="space-y-4">
            <Link
              href="/"
              aria-label={`${siteConfig.name} Home`}
              className="inline-flex items-center gap-3 min-w-[120px] min-h-[44px] bg-[#101010] rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Image
                src="/brand/gees-burger-logo.webp"
                alt={siteConfig.name}
                width={120}
                height={158}
                referrerPolicy="no-referrer"
                className="w-[120px] min-w-[120px] h-auto object-contain"
              />
            </Link>
            <p className="text-sm text-[#E6E6E6]/80 max-w-xs leading-relaxed">
              {siteConfig.name} — Freshly grilled burgers, sliders, crispy fried
              chicken, shawarma, platters, and shakes in Kano.
            </p>
          </div>

          {/* 2. Navigation Links: Home / Menu / Cart */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-[#F8E010]">NAVIGATION</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. NAP (Name, Address, Phone) from config/site.ts */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-[#F8E010]">
              {siteConfig.name}
            </h2>
            <address className="not-italic space-y-2 text-sm text-[#E6E6E6]">
              <p className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#F8E010] shrink-0 mt-1" />
                <span>{siteConfig.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#F8E010] shrink-0" />
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex items-center min-h-[44px] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  {siteConfig.phone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[#F8E010] shrink-0" />
                <span>@{siteConfig.socialHandle}</span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E6E6E6]/80">
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
