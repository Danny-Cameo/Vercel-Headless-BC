import Navbar from 'components/layout/navbar';
import { ensureStartsWith } from 'lib/utils';
import { generateRCAStoreObjects } from 'lib/rca-store-objects';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { ReactNode, Suspense } from 'react';
import './globals.css';

const { TWITTER_CREATOR, TWITTER_SITE, SITE_NAME } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined;
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`
  },
  robots: {
    follow: true,
    index: true
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite
      }
    })
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Generate RCA store objects for the RechargeAdapter script
  const storeObjects = await generateRCAStoreObjects();

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        <Script
          id="rca-store-objects"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.RCA_store_objects = ${JSON.stringify(storeObjects)};`
          }}
        />
        <Script
          src="https://app-data-prod.rechargeadapter.com/v2-prod/static/js/bc.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://platform-data-prod.rechargeadapter.com/hpik7wawzd/hpik7wawzd-data.js"
          strategy="afterInteractive"
        />
        <Navbar />
        <Suspense>
          <main>{children}</main>
        </Suspense>
      </body>
    </html>
  );
}
