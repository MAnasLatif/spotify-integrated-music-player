/**
 * Client-side providers for the application
 * Rules for this file:
 * - Client Component ('use client')
 * - Wrap NextAuth SessionProvider
 * - Include HeroUI Provider with theme support
 * - Handle theme persistence
 * - Keep providers minimal and focused
 */

'use client';

import { HeroUIProvider } from '@heroui/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          themes={['light', 'dark']}
          enableSystem
        >
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
