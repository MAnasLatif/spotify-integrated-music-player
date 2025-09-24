'use client';

import { LogIn, LogOut, Music } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    <header
      className={`border-b border-border bg-card/95 backdrop-blur p-4 supports-[backdrop-filter]:bg-card/95 sticky top-0 z-50 h-16 ${className || ''}`}
    >
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
            <Music className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-lg text-foreground">Spotify Player</p>
            <p className="text-xs text-muted-foreground">Web Music Player</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

              <Avatar className="shrink-0 ring-2 ring-border">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || 'User avatar'}
                />
                <AvatarFallback>
                  {session.user.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-2xl"
              onClick={handleSignIn}
              aria-label="Sign in with Spotify"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In with Spotify
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
