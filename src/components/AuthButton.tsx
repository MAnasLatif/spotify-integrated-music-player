'use client';

import { Loader2, LogIn, LogOut } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';

interface AuthButtonProps {
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  showText?: boolean;
}

export default function AuthButton({
  className,
  size = 'default',
  showText = true,
}: AuthButtonProps) {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    signIn('spotify', { callbackUrl: '/' });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <Button
        className={`${className || ''}`}
        size={size}
        variant="ghost"
        disabled
        aria-label="Loading authentication status"
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {showText && 'Loading...'}
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        className={`text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-border transition-all ${className || ''}`}
        size={size}
        variant="outline"
        onClick={handleSignOut}
        aria-label="Sign out of Spotify"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {showText && 'Sign Out'}
      </Button>
    );
  }

  return (
    <Button
      className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-2xl ${className || ''}`}
      size={size}
      onClick={handleSignIn}
      aria-label="Sign in with Spotify"
    >
      <LogIn className="h-4 w-4 mr-2" />
      {showText && 'Sign In with Spotify'}
    </Button>
  );
}
