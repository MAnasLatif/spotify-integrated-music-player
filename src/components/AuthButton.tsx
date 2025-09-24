/**
 * Auth button component for login/logout
 * Create a React client component with:
 * - Props: define a Props type
 * - Tailwind + HeroUI components (Button)
 * - Accessibility (aria-labels for controls)
 * - Loading + error UI states
 * - No inline styles; use Tailwind classes
 * - Export default component
 */

'use client';

import { Button } from '@heroui/react';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

interface AuthButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?:
    | 'solid'
    | 'bordered'
    | 'light'
    | 'flat'
    | 'faded'
    | 'shadow'
    | 'ghost';
  showText?: boolean;
}

export default function AuthButton({
  className,
  size = 'md',
  variant = 'solid',
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
        className={className}
        size={size}
        variant={variant}
        disabled
        startContent={<Loader2 className="h-4 w-4 animate-spin" />}
        aria-label="Loading authentication status"
      >
        {showText && 'Loading...'}
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        className={className}
        size={size}
        variant={variant}
        color="danger"
        onClick={handleSignOut}
        startContent={<LogOut className="h-4 w-4" />}
        aria-label="Sign out of Spotify"
      >
        {showText && 'Sign Out'}
      </Button>
    );
  }

  return (
    <Button
      className={className}
      size={size}
      variant={variant}
      color="primary"
      onClick={handleSignIn}
      startContent={<LogIn className="h-4 w-4" />}
      aria-label="Sign in with Spotify"
    >
      {showText && 'Sign In'}
    </Button>
  );
}
