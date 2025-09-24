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
    spotifyPlayer.on('ready', async ({ device_id }) => {
      playbackLogger.playerReady(device_id);
      setDeviceId(device_id);
      setIsReady(true);
      setError(null);

      // Auto-transfer playback to this device to make it active
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false, // Don't start playing, just make it the active device
          }),
        });

        if (!response.ok) {
          playbackLogger.error('Failed to auto-transfer playback', undefined, {
            device_id,
            status: response.status,
          });
        }
      } catch (error) {
        playbackLogger.error('Error auto-transferring playback', error, {
          device_id,
        });
      }

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
      <Card className={`bg-card border-border ${className || ''}`}>
        <CardBody>
          <div className="text-center py-6">
            <Music className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!isReady) {
    return (
      <Card className={`bg-card border-border ${className || ''}`}>
        <CardBody>
          <div className="text-center py-6">
            <div className="animate-pulse">
              <Music className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Initializing player...
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`bg-card border-border shadow-lg ${className || ''}`}>
      <CardBody className="p-6">
        <div className="flex flex-col space-y-6">
          {/* Current track info */}
          {currentTrack && (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {currentTrack.album?.images?.[0]?.url ? (
                  <Image
                    src={currentTrack.album.images[0].url}
                    alt={`${currentTrack.album.name} cover`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-foreground text-base truncate"
                  title={currentTrack.name}
                >
                  {currentTrack.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentTrack.artists
                    ?.map((artist) => artist.name)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-3">
            <Slider
              size="md"
              step={1000}
              maxValue={duration}
              value={position}
              onChange={handleSeek}
              className="w-full"
              aria-label="Track progress"
              classNames={{
                track: 'border-border',
                filler: 'bg-green-500',
                thumb: 'bg-green-500 border-green-500 shadow-lg',
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>{formatDuration(position)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                isIconOnly
                variant="ghost"
                onClick={handlePrevious}
                aria-label="Previous track"
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                size="lg"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                isIconOnly
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                size="lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                )}
              </Button>

              <Button
                isIconOnly
                variant="ghost"
                onClick={handleNext}
                aria-label="Next track"
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                size="lg"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume control */}
            <div className="flex items-center space-x-3 w-40">
              <Button
                isIconOnly
                size="md"
                variant="ghost"
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
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
                classNames={{
                  track: 'border-border',
                  filler: 'bg-green-500',
                  thumb: 'bg-green-500 border-green-500',
                }}
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
