import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import Header from '@/components/Header';

import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Spotify Music Player',
  description: 'A modern Spotify-integrated music player built with Next.js 15',
  keywords: ['spotify', 'music', 'player', 'nextjs', 'streaming'],
  authors: [{ name: 'Your Name' }],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground transition-colors duration-300`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
