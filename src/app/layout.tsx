import type { Metadata } from 'next';
import { Bebas_Neue, Poppins } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { buildRestaurantJsonLd, getBaseUrl } from '@/lib/seo';
import { AppStateProvider } from '@/state/context';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AlertViewport } from '@/components/feedback/alert-viewport';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

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
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${poppins.variable}`}
    >
      <head>
        <meta name="theme-color" content="#101010" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var theme = localStorage.getItem('gees.theme');
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
} catch {
  var theme = 'dark';
}
document.documentElement.dataset.theme = theme;
document.documentElement.style.colorScheme = theme;
var themeColor = document.querySelector('meta[name="theme-color"]');
var pageBackground = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
if (themeColor && pageBackground) themeColor.content = pageBackground;`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-text antialiased selection:bg-brand selection:text-on-brand">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(restaurantJsonLd),
          }}
        />
        <ThemeProvider>
          <AppStateProvider>
            <SiteHeader />
            <div className="flex-1 flex flex-col">{children}</div>
            <SiteFooter />
            <AlertViewport />
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
