/**
 * Home page - displays user playlists or login prompt
 * Rules for this file:
 * - Server Component by default; use 'use client' only when needed
 * - Handle authentication state
 * - Fetch and display playlists
 * - Proper error handling and loading states
 * - Accessibility: semantic headings and navigation
 */

'use client';

import { Button } from '@heroui/react';
import { Music, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

import AuthButton from '@/components/AuthButton';
import PlaylistGrid from '@/components/PlaylistGrid';
import { useToastContext } from '@/components/ToastProvider';
import { logger } from '@/lib/logger';
import type { SpotifyPlaylist } from '@/types/spotify';

export default function Home() {
  const { data: session, status } = useSession();
  const { showToast } = useToastContext();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spotify/playlists?limit=50');

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to load playlists' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPlaylists(data.items || []);

      // Show success toast only if we have playlists
      if (data.items && data.items.length > 0) {
        showToast({
          title: 'Playlists loaded',
          description: `Found ${data.items.length} playlist${data.items.length !== 1 ? 's' : ''}`,
          variant: 'success',
          duration: 3000,
        });
      }

      logger.info('Playlists loaded successfully', {
        count: data.items?.length || 0,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load playlists';
      setError(message);
      showToast({
        title: 'Failed to load playlists',
        description: message,
        variant: 'error',
      });
      logger.error('Failed to fetch playlists', error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, showToast]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchPlaylists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.accessToken]);

  // Show loading state during authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-2xl">
            <Music className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
            Welcome to Spotify Player
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
            Connect your Spotify account to browse your playlists and enjoy
            music directly in your browser. Premium account required for
            playback.
          </p>
          <div className="space-y-4">
            <AuthButton size="lg" />
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to Spotify&apos;s Terms of Service
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (session.error === 'RefreshAccessTokenError') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20">
            <Music className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Authentication Expired
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Your Spotify session has expired. Please sign in again.
          </p>
          <AuthButton size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Your Playlists</h1>
          <p className="text-muted-foreground">
            {playlists.length > 0
              ? `${playlists.length} playlist${playlists.length !== 1 ? 's' : ''} found`
              : 'Discover your music collection'}
          </p>
        </div>

        {playlists.length > 0 && (
          <Button
            variant="bordered"
            size="md"
            onClick={fetchPlaylists}
            disabled={loading}
            startContent={
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            }
            aria-label="Refresh playlists"
            className="border-border hover:bg-muted hover:text-foreground transition-colors"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Playlists Grid */}
      <PlaylistGrid
        playlists={playlists}
        loading={loading}
        error={error}
        onRetry={fetchPlaylists}
        className="mt-6"
      />
    </div>
  );
}
