'use client';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

const ERROR_MESSAGES = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied:
    'Access was denied. Please check your Spotify account permissions.',
  Verification: 'The verification token is invalid or has expired.',
  Default: 'An error occurred during authentication. Please try again.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get('error') as keyof typeof ERROR_MESSAGES;
  const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  const handleRetry = () => {
    signIn('spotify', { callbackUrl: '/' });
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-600 leading-relaxed">{errorMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRetry}
            aria-label="Retry authentication"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={handleGoHome}
            aria-label="Go to home page"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If the problem persists, please check your Spotify account settings
            and make sure third-party app access is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
