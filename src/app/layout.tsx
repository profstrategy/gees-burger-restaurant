import type { Metadata } from 'next';
import { Bebas_Neue, Poppins } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { buildRestaurantJsonLd, getBaseUrl } from '@/lib/seo';
import { AppStateProvider } from '@/state/context';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AlertViewport } from '@/components/feedback/alert-viewport';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Gee's Burger | Burgers, Fried Chicken, Grills & Shakes in Kano",
    template: "%s | Gee's Burger",
  },
  description:
    "Order Gee's Burger online in Kano — flame-grilled burgers, sliders, fried chicken, shawarma, Lebanese platters, milkshakes and desserts via WhatsApp.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: siteConfig.name,
    title: "Gee's Burger | Burgers, Fried Chicken, Grills & Shakes in Kano",
    description:
      "Order Gee's Burger online in Kano — flame-grilled burgers, sliders, fried chicken, shawarma, Lebanese platters, milkshakes and desserts via WhatsApp.",
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Gee's Burger | Burgers, Fried Chicken, Grills & Shakes in Kano",
    description:
      "Order Gee's Burger online in Kano — flame-grilled burgers, sliders, fried chicken, shawarma, Lebanese platters, milkshakes and desserts via WhatsApp.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const restaurantJsonLd = buildRestaurantJsonLd();

  return (
    <html lang="en" className={`${bebasNeue.variable} ${poppins.variable} dark`}>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#101010] text-[#F8F8F8] antialiased selection:bg-[#F8E010] selection:text-[#101010]"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(restaurantJsonLd),
          }}
        />
        <AppStateProvider>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
          <AlertViewport />
        </AppStateProvider>
      </body>
    </html>
  );
}
