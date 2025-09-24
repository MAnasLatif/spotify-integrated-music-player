'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { ToastProvider } from '@/components/ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        themes={['light', 'dark']}
        enableSystem
      >
        <ToastProvider>{children}</ToastProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
