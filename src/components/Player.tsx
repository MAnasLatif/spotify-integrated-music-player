'use client';

import { Button, Card, CardBody, Progress, Slider } from '@heroui/react';
import { clsx } from '@heroui/shared-utils';
import {
  Heart,
  Music,
  PauseCircle,
  PlayCircle,
  Repeat,
  Shuffle,
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
  const [liked, setLiked] = useState(false);
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
    <Card
      isBlurred
      className={clsx(
        'border-none bg-background/60 dark:bg-default-100/50',
        className,
      )}
      shadow="sm"
    >
      <CardBody>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
          <div className="relative col-span-6 md:col-span-4">
            {currentTrack?.album?.images?.[0]?.url ? (
              <Image
                alt="Album cover"
                className="object-cover shadow-black/20 shadow-lg"
                height={200}
                src={currentTrack.album.images[0].url}
                width={200}
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-default-100 rounded-lg flex items-center justify-center shadow-lg">
                <Music className="h-16 w-16 text-default-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col col-span-6 md:col-span-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0">
                <h3 className="font-semibold text-foreground/90">
                  {currentTrack?.album?.name || 'No album'}
                </h3>
                <p className="text-sm text-foreground/80">
                  {currentTrack ? '1 Track' : 'No tracks'}
                </p>
                <h1 className="text-lg font-medium mt-2">
                  {currentTrack?.name || 'No track playing'}
                </h1>
                <p className="text-sm text-foreground/60">
                  {currentTrack?.artists
                    ?.map((artist) => artist.name)
                    .join(', ') || 'Unknown artist'}
                </p>
              </div>
              <Button
                isIconOnly
                className="text-default-900/60 data-[hover=true]:bg-foreground/10 -translate-y-2 translate-x-2"
                radius="full"
                variant="light"
                onPress={() => setLiked((v) => !v)}
              >
                <Heart
                  className={liked ? '[&>path]:stroke-transparent' : ''}
                  fill={liked ? 'currentColor' : 'none'}
                />
              </Button>
            </div>

            <div className="flex flex-col mt-3 gap-1">
              <Progress
                aria-label="Music progress"
                classNames={{
                  indicator: 'bg-default-800 dark:bg-white',
                  track: 'bg-default-500/30',
                }}
                color="default"
                size="sm"
                value={duration > 0 ? (position / duration) * 100 : 0}
              />
              <div className="flex justify-between">
                <p className="text-sm">{formatDuration(position)}</p>
                <p className="text-sm text-foreground/50">
                  {formatDuration(duration)}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-center mt-4">
              <Button
                isIconOnly
                className="data-[hover=true]:bg-foreground/10"
                radius="full"
                variant="light"
              >
                <Repeat className="text-foreground/80" />
              </Button>
              <Button
                isIconOnly
                className="data-[hover=true]:bg-foreground/10"
                radius="full"
                variant="light"
                onClick={handlePrevious}
              >
                <SkipBack />
              </Button>
              <Button
                isIconOnly
                className="w-auto h-auto data-[hover=true]:bg-foreground/10"
                radius="full"
                variant="light"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <PauseCircle size={54} />
                ) : (
                  <PlayCircle size={54} />
                )}
              </Button>
              <Button
                isIconOnly
                className="data-[hover=true]:bg-foreground/10"
                radius="full"
                variant="light"
                onClick={handleNext}
              >
                <SkipForward />
              </Button>
              <Button
                isIconOnly
                className="data-[hover=true]:bg-foreground/10"
                radius="full"
                variant="light"
              >
                <Shuffle className="text-foreground/80" />
              </Button>
            </div>

            {/* Volume control - moved to bottom */}
            <div className="flex items-center justify-center space-x-3 mt-4">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="text-foreground/60 data-[hover=true]:bg-foreground/10"
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
                className="flex-1 max-w-32"
                aria-label="Volume"
                classNames={{
                  track: 'bg-default-500/30',
                  filler: 'bg-default-800 dark:bg-white',
                  thumb: 'bg-default-800 dark:bg-white',
                }}
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
