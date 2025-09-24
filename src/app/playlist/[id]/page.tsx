'use client';

import { ArrowLeft, Music, Play, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import Player from '@/components/Player';
import { useToastContext } from '@/components/ToastProvider';
import TrackList from '@/components/TrackList';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { formatNumber } from '@/lib/utils';
import type { SpotifyPlaylist, SpotifyPlaylistTrack } from '@/types/spotify';

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToastContext();

  // Properly extract the id parameter with error handling
  const playlistId = React.useMemo(() => {
    if (!params?.id) return null;
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params?.id]);

  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistNotFound, setPlaylistNotFound] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [playerError, setPlayerError] = useState<string>('');
  const [mounted, setMounted] = useState(false);

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
        } else {
          // Try to fetch more playlists if not found in first 50
          const morePlaylistsResponse = await fetch(
            '/api/spotify/playlists?limit=50&offset=50',
          );
          if (morePlaylistsResponse.ok) {
            const morePlaylistsData = await morePlaylistsResponse.json();
            const foundInMore = morePlaylistsData.items.find(
              (p: SpotifyPlaylist) => p.id === playlistId,
            );
            if (foundInMore) {
              setPlaylist(foundInMore);
            } else {
              setPlaylistNotFound(true);
              logger.warn('Playlist not found in user playlists', {
                playlistId,
              });
            }
          }
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
        playlistId: playlistId,
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
      logger.error('Failed to fetch tracks', error, { playlistId: playlistId });
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && playlistId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.accessToken, playlistId]);

  const transferPlaybackToDevice = async (deviceId: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: 'Failed to transfer playback' } }));
        throw new Error(
          error.error?.message || 'Failed to transfer playback to device',
        );
      }

      logger.info('Playback transferred to device', { deviceId });
      return true;
    } catch (error) {
      logger.error('Failed to transfer playback', error, { deviceId });
      return false;
    }
  };

  const handlePlayTrack = async (trackUri: string) => {
    if (!deviceId) {
      setPlayerError('Player not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // First, try to transfer playback to our device to ensure it's active
      const transferred = await transferPlaybackToDevice(deviceId);
      if (!transferred) {
        throw new Error('Failed to activate device for playback');
      }

      // Wait a moment for the transfer to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Now start playback on the specific track
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
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: 'Playback failed' } }));

        // If device is not found, try transferring again
        if (
          response.status === 404 ||
          errorData.error?.reason === 'NO_ACTIVE_DEVICE'
        ) {
          const retryTransfer = await transferPlaybackToDevice(deviceId);
          if (retryTransfer) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Retry the play request
            const retryResponse = await fetch(
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

            if (!retryResponse.ok) {
              const retryError = await retryResponse.json().catch(() => ({
                error: { message: 'Playback failed after retry' },
              }));
              throw new Error(
                retryError.error?.message ||
                  'Failed to start playback after device activation',
              );
            }
          } else {
            throw new Error(
              'Device not available for playback. Please try again.',
            );
          }
        } else {
          throw new Error(
            errorData.error?.message || 'Failed to start playback',
          );
        }
      }

      logger.info('Track playback started', { trackUri, deviceId });
      setPlayerError(''); // Clear any previous errors
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

  // Don't render until mounted (prevent hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Handle loading state first
  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
          <div className="w-32 h-6 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Redirect if no valid playlist ID
  if (!playlistId) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
    return null;
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Show playlist not found state
  if (playlistNotFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium text-gray-900">Playlist</h1>
        </div>

        <div className="text-center py-12">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Playlist Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The playlist you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Show loading state (remove duplicate)
  if (loading) {
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
    <ErrorBoundary>
      <div className="min-h-screen pb-6">
        <div className="space-y-6">
          {/* Navigation */}
          <div className="flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-4 -mt-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
            <Button
              size="icon"
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
                    src={playlist.images?.[0]?.url || ''}
                    alt={`${playlist.name || 'Unknown'} playlist cover`}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.warn('Failed to load playlist image');
                    }}
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
                    size="lg"
                    onClick={() => {
                      // Play first track if available
                      if (tracks.length > 0 && tracks[0].track.uri) {
                        handlePlayTrack(tracks[0].track.uri);
                      }
                    }}
                    disabled={!deviceId || tracks.length === 0}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Play className="h-5 w-5 fill-current mr-2" />
                    Play
                  </Button>

                  <Button
                    variant="outline"
                    onClick={fetchTracks}
                    disabled={tracksLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${tracksLoading ? 'animate-spin' : ''}`}
                    />
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
            <>
              <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
                <div className="container mx-auto max-w-7xl">
                  <Player
                    onReady={handlePlayerReady}
                    onError={handlePlayerError}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
