/**
 * Spotify Web Playback SDK Player component
 * Create a React client component with:
 * - Props: define a Props type
 * - Tailwind + HeroUI components (Button, Card, Slider)
 * - Accessibility (aria-labels for controls)
 * - Loading + error UI states
 * - No inline styles; use Tailwind classes
 * - Export default component
 */

'use client';

import { Button, Card, CardBody, Slider } from '@heroui/react';
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playbackLogger } from '@/lib/logger';
import { formatDuration } from '@/lib/utils';
import type {
  SpotifyPlaybackState,
  SpotifyPlayer,
  SpotifyTrack,
} from '@/types/spotify';

interface PlayerProps {
  className?: string;
  onReady?: (deviceId: string) => void;
  onError?: (error: string) => void;
}

// Global Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

export default function Player({ className, onReady, onError }: PlayerProps) {
  const { data: session } = useSession();
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [, setDeviceId] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Spotify Web Playbook SDK
  useEffect(() => {
    if (sdkLoaded || !session?.accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSdkLoaded(true);
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [session?.accessToken, sdkLoaded]);

  // Initialize player when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !session?.accessToken || player) return;

    const spotifyPlayer = new window.Spotify.Player({
      name: 'Spotify Music Player',
      getOAuthToken: (cb) => {
        if (session?.accessToken) {
          cb(session.accessToken);
        }
      },
      volume: 0.5,
    });

    // Player ready
    spotifyPlayer.on('ready', ({ device_id }) => {
      playbackLogger.playerReady(device_id);
      setDeviceId(device_id);
      setIsReady(true);
      setError(null);
      onReady?.(device_id);
    });

    // Player not ready
    spotifyPlayer.on('not_ready', ({ device_id }) => {
      playbackLogger.error('Player not ready', undefined, { device_id });
      setIsReady(false);
    });

    // Player state changes
    spotifyPlayer.on(
      'player_state_changed',
      (state: SpotifyPlaybackState | null) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.track_window.current_track.duration_ms);

        playbackLogger.stateChange(
          state.paused ? 'paused' : 'playing',
          state.track_window.current_track.id,
        );
      },
    );

    // Initialization errors
    spotifyPlayer.on('initialization_error', ({ message }) => {
      playbackLogger.playerError(new Error(message));
      setError('Failed to initialize player');
      onError?.('Failed to initialize player');
    });

    // Authentication errors
    spotifyPlayer.on('authentication_error', ({ message }) => {
      playbackLogger.error('Authentication error', new Error(message));
      setError('Authentication failed');
      onError?.('Authentication failed');
    });

    // Account errors
    spotifyPlayer.on('account_error', ({ message }) => {
      playbackLogger.error('Account error', new Error(message));
      setError('Spotify Premium required for playback');
      onError?.('Spotify Premium required for playback');
    });

    // Playback errors
    spotifyPlayer.on('playback_error', ({ message }) => {
      playbackLogger.error('Playback error', new Error(message));
      setError('Playback error occurred');
      onError?.('Playback error occurred');
    });

    // Connect to the player
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      spotifyPlayer.disconnect();
    };
  }, [sdkLoaded, session?.accessToken, player, onReady, onError]);

  // Update position every second when playing
  useEffect(() => {
    if (isPlaying && player) {
      intervalRef.current = setInterval(async () => {
        const state = await player.getCurrentState();
        if (state) {
          setPosition(state.position);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, player]);

  const handlePlayPause = useCallback(async () => {
    if (!player) return;

    try {
      await player.togglePlay();
    } catch (error) {
      playbackLogger.error('Failed to toggle play/pause', error);
    }
  }, [player]);

  const handlePrevious = useCallback(async () => {
    if (!player) return;

    try {
      await player.previousTrack();
    } catch (error) {
      playbackLogger.error('Failed to skip to previous track', error);
    }
  }, [player]);

  const handleNext = useCallback(async () => {
    if (!player) return;

    try {
      await player.nextTrack();
    } catch (error) {
      playbackLogger.error('Failed to skip to next track', error);
    }
  }, [player]);

  const handleSeek = useCallback(
    async (value: number | number[]) => {
      if (!player) return;

      const seekPosition = Array.isArray(value) ? value[0] : value;

      try {
        await player.seek(seekPosition);
        setPosition(seekPosition);
      } catch (error) {
        playbackLogger.error('Failed to seek', error);
      }
    },
    [player],
  );

  const handleVolumeChange = useCallback(
    async (value: number | number[]) => {
      if (!player) return;

      const newVolume = (Array.isArray(value) ? value[0] : value) / 100;

      try {
        await player.setVolume(newVolume);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
      } catch (error) {
        playbackLogger.error('Failed to change volume', error);
      }
    },
    [player],
  );

  const handleMuteToggle = useCallback(async () => {
    if (!player) return;

    try {
      const newVolume = isMuted ? volume : 0;
      await player.setVolume(newVolume);
      setIsMuted(!isMuted);
    } catch (error) {
      playbackLogger.error('Failed to toggle mute', error);
    }
  }, [player, isMuted, volume]);

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-4">
            <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!isReady) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-4">
            <div className="animate-pulse">
              <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Initializing player...</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Current track info */}
          {currentTrack && (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                {currentTrack.album?.images?.[0]?.url ? (
                  <Image
                    src={currentTrack.album.images[0].url}
                    alt={`${currentTrack.album.name} cover`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="font-medium text-sm truncate"
                  title={currentTrack.name}
                >
                  {currentTrack.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentTrack.artists
                    ?.map((artist) => artist.name)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-2">
            <Slider
              size="sm"
              step={1000}
              maxValue={duration}
              value={position}
              onChange={handleSeek}
              className="w-full"
              aria-label="Track progress"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDuration(position)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                isIconOnly
                variant="ghost"
                onClick={handlePrevious}
                aria-label="Previous track"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                isIconOnly
                color="primary"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </Button>

              <Button
                isIconOnly
                variant="ghost"
                onClick={handleNext}
                aria-label="Next track"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume control */}
            <div className="flex items-center space-x-2 w-32">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Slider
                size="sm"
                step={1}
                maxValue={100}
                value={isMuted ? 0 : volume * 100}
                onChange={handleVolumeChange}
                className="flex-1"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
