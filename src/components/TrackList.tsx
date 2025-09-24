'use client';

import { Music, Play, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatDuration, truncateText } from '@/lib/utils';
import type { SpotifyPlaylistTrack } from '@/types/spotify';

interface TrackListProps {
  tracks: SpotifyPlaylistTrack[];
  loading?: boolean;
  error?: string | null;
  onPlay?: (trackUri: string) => void;
  onRetry?: () => void;
  className?: string;
}

interface TrackRowProps {
  track: SpotifyPlaylistTrack['track'];
  index: number;
  onPlay?: (trackUri: string) => void;
}

function TrackRow({ track, index, onPlay }: TrackRowProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = track.album.images?.[0]?.url;

  const handlePlay = () => {
    if (onPlay && track.uri) {
      onPlay(track.uri);
    }
  };

  const artistNames = track.artists.map((artist) => artist.name).join(', ');

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="w-12 px-4 py-3">
        <div className="flex items-center justify-center">
          {onPlay ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Play ${track.name}`}
              onClick={handlePlay}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
            >
              <Play className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <span className="text-sm text-gray-500">{index + 1}</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={`${track.album.name} cover`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {truncateText(track.name, 50)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {truncateText(artistNames, 60)}
            </p>
          </div>
        </div>
      </td>

      <td className="hidden md:table-cell px-4 py-3">
        <span className="text-sm text-gray-600">
          {truncateText(track.album.name, 30)}
        </span>
      </td>

      <td className="text-right px-4 py-3">
        <span className="text-sm text-gray-500">
          {formatDuration(track.duration_ms)}
        </span>
      </td>
    </tr>
  );
}

function TrackSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mx-auto" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 animate-pulse rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 animate-pulse rounded w-12 ml-auto" />
      </td>
    </tr>
  );
}

export default function TrackList({
  tracks,
  loading = false,
  error = null,
  onPlay,
  onRetry,
  className,
}: TrackListProps) {
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load tracks
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            aria-label="Retry loading tracks"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Album
              </th>
              <th className="w-20 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 10 }, (_, i) => (
                <TrackSkeleton key={`skeleton-${i}`} />
              ))
            ) : tracks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    No tracks found in this playlist
                  </p>
                </td>
              </tr>
            ) : (
              tracks.map((track, index) => (
                <TrackRow
                  key={track.track.id}
                  track={track.track}
                  index={index}
                  onPlay={onPlay}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
