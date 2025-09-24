/**
 * Playlist detail page - shows tracks and playback controls
 * Rules for this file:
 * - Server Component by default; use 'use client' only when needed
 * - Handle authentication state
 * - Fetch playlist and track data
 * - Include player component for playback
 * - Proper error handling and loading states
 * - Accessibility: semantic headings and navigation
 */

'use client';

import { Button } from '@heroui/react';
import { ArrowLeft, Music, Play, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

import Player from '@/components/Player';
import { useToastContext } from '@/components/ToastProvider';
import TrackList from '@/components/TrackList';
import { logger } from '@/lib/logger';
import { formatNumber } from '@/lib/utils';
import type { SpotifyPlaylist, SpotifyPlaylistTrack } from '@/types/spotify';

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToastContext();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [playerError, setPlayerError] = useState<string>('');

  const fetchPlaylistInfo = useCallback(async () => {
    if (!session?.accessToken || !playlistId) return;

    try {
      // Get playlist info from the playlists API (we'll need to find it in the list)
      const playlistsResponse = await fetch('/api/spotify/playlists?limit=50');
      if (playlistsResponse.ok) {
        const playlistsData = await playlistsResponse.json();
        const foundPlaylist = playlistsData.items.find(
          (p: SpotifyPlaylist) => p.id === playlistId,
        );
        if (foundPlaylist) {
          setPlaylist(foundPlaylist);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch playlist info', error);
    }
  }, [session?.accessToken, playlistId]);

  const fetchTracks = useCallback(async () => {
    if (!session?.accessToken || !playlistId) return;

    setTracksLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spotify/playlists/${playlistId}/tracks`,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to load tracks' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setTracks(data.items || []);

      logger.info('Tracks loaded successfully', {
        playlistId,
        count: data.items?.length || 0,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load tracks';
      setError(message);
      showToast({
        title: 'Failed to load tracks',
        description: message,
        variant: 'error',
      });
      logger.error('Failed to fetch tracks', error, { playlistId });
    } finally {
      setTracksLoading(false);
    }
  }, [session?.accessToken, playlistId, showToast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlaylistInfo(), fetchTracks()]);
    setLoading(false);
  }, [fetchPlaylistInfo, fetchTracks]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && playlistId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.accessToken, playlistId]);

  const handlePlayTrack = async (trackUri: string) => {
    if (!deviceId) {
      setPlayerError('Player not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Transfer playback and play the specific track
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/play',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_id: deviceId,
            uris: [trackUri],
          }),
        },
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: 'Playback failed' } }));
        throw new Error(error.error?.message || 'Failed to start playback');
      }

      logger.info('Track playback started', { trackUri, deviceId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to play track';
      setPlayerError(message);
      showToast({
        title: 'Playback error',
        description: message,
        variant: 'error',
      });
      logger.error('Failed to play track', error, { trackUri, deviceId });
    }
  };

  const handlePlayerReady = (newDeviceId: string) => {
    setDeviceId(newDeviceId);
    setPlayerError('');
  };

  const handlePlayerError = (error: string) => {
    setPlayerError(error);
  };

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
          <div className="w-32 h-6 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Playlist info skeleton */}
        <div className="flex items-start gap-6">
          <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-4">
            <div className="w-64 h-8 bg-gray-200 animate-pulse rounded" />
            <div className="w-40 h-4 bg-gray-200 animate-pulse rounded" />
            <div className="w-96 h-4 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>

        {/* Tracks skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-2">
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-48 h-4 bg-gray-200 animate-pulse rounded" />
                <div className="w-32 h-3 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="ghost"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium text-gray-900">Playlist</h1>
      </div>

      {/* Playlist Header */}
      {playlist && (
        <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
          <div className="w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden shrink-0">
            {playlist.images?.[0]?.url ? (
              <Image
                src={playlist.images[0].url!}
                alt={`${playlist.name} playlist cover`}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                Playlist
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1 mb-2">
                {playlist.name}
              </h2>
              {playlist.description && (
                <p className="text-gray-600 leading-relaxed">
                  {playlist.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{playlist.owner.display_name || 'Unknown'}</span>
              <span>•</span>
              <span>{formatNumber(playlist.tracks.total)} tracks</span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                color="primary"
                size="lg"
                startContent={<Play className="h-5 w-5 fill-current" />}
                onClick={() => {
                  // Play first track if available
                  if (tracks.length > 0 && tracks[0].track.uri) {
                    handlePlayTrack(tracks[0].track.uri);
                  }
                }}
                disabled={!deviceId || tracks.length === 0}
              >
                Play
              </Button>

              <Button
                variant="bordered"
                onClick={fetchTracks}
                disabled={tracksLoading}
                startContent={
                  <RefreshCw
                    className={`h-4 w-4 ${tracksLoading ? 'animate-spin' : ''}`}
                  />
                }
              >
                Refresh
              </Button>
            </div>

            {playerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{playerError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Track List */}
      <TrackList
        tracks={tracks}
        loading={tracksLoading}
        error={error}
        onPlay={handlePlayTrack}
        onRetry={fetchTracks}
      />

      {/* Player */}
      {session && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto">
            <Player onReady={handlePlayerReady} onError={handlePlayerError} />
          </div>
        </div>
      )}

      {/* Add bottom padding to account for fixed player */}
      <div className="h-32" />
    </div>
  );
}
