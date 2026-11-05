import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-[#101010] border-t border-white/10 text-[#E6E6E6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand Column (Logo strictly on black, min-width 120px) */}
          <div className="space-y-4">
            <Link
              href="/"
              aria-label="Gee's Burger Home"
              className="inline-flex items-center gap-3 min-w-[120px] min-h-[44px] bg-[#101010] rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010]"
            >
              <Image
                src="/brand/gees-burger-logo.webp"
                alt="Gee's Burger"
                width={48}
                height={64}
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain"
              />
              <span className="font-display text-3xl text-[#F8E010] tracking-wider">
                GEE&apos;S BURGER
              </span>
            </Link>
            <p className="text-sm text-[#E6E6E6]/80 max-w-xs leading-relaxed">
              Freshly grilled burgers, sliders, crispy fried chicken, shawarma,
              Lebanese platters, milkshakes and desserts in Kano.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-[#F8E010]">EXPLORE</h2>
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
                  Full Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Your Cart &amp; Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Menus from Catalog */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-[#F8E010]">MENU HIGHLIGHTS</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/menu?menu=menu_burgers"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Burgers &amp; Sliders (x2)
                </Link>
              </li>
              <li>
                <Link
                  href="/menu?menu=menu_gee_s_fried_chicken"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Gee&apos;s Fried Chicken
                </Link>
              </li>
              <li>
                <Link
                  href="/menu?menu=menu_platters"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Platters &amp; Sandwiches
                </Link>
              </li>
              <li>
                <Link
                  href="/menu?menu=menu_drinks"
                  className="inline-flex items-center min-h-[44px] text-[#E6E6E6] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  Drinks &amp; Milkshakes
                </Link>
              </li>
            </ul>
          </div>

          {/* Visit & Contact */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-[#F8E010]">VISIT US IN KANO</h2>
            <div className="space-y-3 text-sm text-[#E6E6E6]">
              <p className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#F8E010] shrink-0 mt-1" />
                <span>No. 32 Bompai Road, opposite Grand Square, Kano</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#F8E010] shrink-0" />
                <a
                  href="tel:09166606000"
                  className="inline-flex items-center min-h-[44px] hover:text-[#F8E010] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  0916 660 6000
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#F8E010] shrink-0" />
                <span>Open Daily · Order via WhatsApp</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B6B]">
          <p>© {new Date().getFullYear()} Gee&apos;s Burger Kano. All rights reserved.</p>
          <p>No. 32 Bompai Road, opposite Grand Square, Kano · Orders via WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}
