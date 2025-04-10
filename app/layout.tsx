import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrivateCharterX - Private Jet Charter',
  description: 'Experience unparalleled luxury and convenience with our private jet charter services. Available 24/7 worldwide.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}