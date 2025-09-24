/**
 * Root layout with providers and global styles
 * Rules for this file:
 * - Server Component by default; use 'use client' only when needed
 * - Include NextAuth SessionProvider for client components
 * - HeroUI Provider for theme and components
 * - Proper metadata and font configuration
 * - Accessibility: semantic HTML structure
 */

import '@/styles/globals.css';

import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'Spotify Music Player',
  description: 'A modern Spotify-integrated music player built with Next.js 15',
  keywords: ['spotify', 'music', 'player', 'nextjs', 'streaming'],
  authors: [{ name: 'Your Name' }],
  viewport: 'width=device-width, initial-scale=1',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
