import React from 'react';
import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Your Cart & WhatsApp Checkout',
  description:
    "Review your Gee's Burger cart, choose Pickup or Delivery in Kano, and send your order directly via WhatsApp.",
  alternates: {
    canonical: '/cart',
  },
  openGraph: {
    title: "Your Cart | Gee's Burger Kano",
    description:
      "Review your Gee's Burger cart, choose Pickup or Delivery in Kano, and send your order directly via WhatsApp.",
    url: '/cart',
    type: 'website',
  },
};

export default function Page() {
  return (
    <main className="flex-1">
      <CartPage />
    </main>
  );
}
