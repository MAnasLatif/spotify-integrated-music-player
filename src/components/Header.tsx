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
    <Navbar className={className} maxWidth="full" position="sticky">
      <NavbarBrand>
        <Music className="h-6 w-6 mr-2" aria-hidden="true" />
        <p className="font-bold text-inherit">Spotify Player</p>
      </NavbarBrand>

      <NavbarContent justify="end">
        <NavbarItem>
          {status === 'loading' ? (
            <div className="h-10 w-24 animate-pulse bg-gray-200 rounded-lg" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>

              <Avatar
                src={session.user.image || undefined}
                name={
                  session.user.name ? getInitials(session.user.name) : undefined
                }
                size="sm"
                className="shrink-0"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                startContent={<LogOut className="h-4 w-4" />}
                aria-label="Sign out"
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              color="primary"
              onClick={handleSignIn}
              startContent={<LogIn className="h-4 w-4" />}
              aria-label="Sign in with Spotify"
            >
              Sign In
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
