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
import { logger } from '@/lib/logger';
import type { SpotifyPlaylist } from '@/types/spotify';

export default function Home() {
  const { data: session, status } = useSession();
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

      logger.info('Playlists loaded successfully', {
        count: data.items?.length || 0,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load playlists';
      setError(message);
      logger.error('Failed to fetch playlists', error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <Music className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Spotify Player
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Connect your Spotify account to browse your playlists and enjoy
            music directly in your browser. Premium account required for
            playback.
          </p>
          <AuthButton size="lg" />
          <p className="text-xs text-gray-500 mt-4">
            By signing in, you agree to Spotify&apos;s Terms of Service
          </p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (session.error === 'RefreshAccessTokenError') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <Music className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Expired
          </h2>
          <p className="text-gray-600 mb-6">
            Your Spotify session has expired. Please sign in again.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Playlists</h1>
          <p className="text-gray-600 mt-1">
            {playlists.length > 0
              ? `${playlists.length} playlists`
              : 'Discover your music'}
          </p>
        </div>

        {playlists.length > 0 && (
          <Button
            variant="bordered"
            size="sm"
            onClick={fetchPlaylists}
            disabled={loading}
            startContent={
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            }
            aria-label="Refresh playlists"
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
      />
    </div>
  );
}
