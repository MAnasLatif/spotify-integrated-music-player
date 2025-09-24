/**
 * Create a React client component with:
 * - Props: define a Props type
 * - Tailwind + HeroUI components (Button, Avatar, Navbar)
 * - Accessibility (aria-labels for controls)
 * - Loading + error UI states
 * - No inline styles; use Tailwind classes
 * - Export default component
 */

'use client';

import {
  Avatar,
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react';
import { LogIn, LogOut, Music } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

import { getInitials } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    signIn('spotify', { callbackUrl: '/' });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <Navbar
      className={`border-b border-border bg-card/95 backdrop-blur p-1 supports-[backdrop-filter]:bg-card/95 ${className || ''}`}
      maxWidth="full"
      position="sticky"
      height="4rem"
    >
      <NavbarBrand className="gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
          <Music className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <p className="font-bold text-lg text-foreground">Spotify Player</p>
          <p className="text-xs text-muted-foreground">Web Music Player</p>
        </div>
      </NavbarBrand>

      <NavbarContent justify="end" className="gap-4">
        <NavbarItem>
          {status === 'loading' ? (
            <div className="h-10 w-32 animate-pulse bg-muted rounded-lg" />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>

              <Avatar
                src={session.user.image || undefined}
                name={
                  session.user.name ? getInitials(session.user.name) : undefined
                }
                size="md"
                className="shrink-0 ring-2 ring-border"
              />

              <Button
                variant="ghost"
                size="sm"
                onPress={handleSignOut}
                startContent={<LogOut className="h-4 w-4" />}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-2xl"
              onPress={handleSignIn}
              startContent={<LogIn className="h-4 w-4" />}
              aria-label="Sign in with Spotify"
              size="md"
            >
              Sign In with Spotify
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
