'use client';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Music, Play, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
    <TableRow key={track.id} className="hover:bg-gray-50">
      <TableCell className="w-12">
        <div className="flex items-center justify-center">
          {onPlay ? (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={handlePlay}
              aria-label={`Play ${track.name}`}
              className="w-8 h-8"
            >
              <Play className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <span className="text-sm text-gray-500 font-mono">{index + 1}</span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0 overflow-hidden">
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
              <Music className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={track.name}>
              {track.name}
            </p>
            <p className="text-xs text-gray-500 truncate" title={artistNames}>
              {artistNames}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <p className="text-sm text-gray-600 truncate" title={track.album.name}>
          {truncateText(track.album.name, 30)}
        </p>
      </TableCell>

      <TableCell className="text-right">
        <span className="text-sm text-gray-500 font-mono">
          {formatDuration(track.duration_ms)}
        </span>
      </TableCell>
    </TableRow>
  );
}

function TrackSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mx-auto" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="h-4 bg-gray-200 animate-pulse rounded" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 animate-pulse rounded w-12 ml-auto" />
      </TableCell>
    </TableRow>
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
            color="primary"
            variant="bordered"
            onClick={onRetry}
            startContent={<RefreshCw className="h-4 w-4" />}
            aria-label="Retry loading tracks"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Table aria-label="Playlist tracks" className="min-w-full" removeWrapper>
        <TableHeader>
          <TableColumn className="w-12">#</TableColumn>
          <TableColumn>Title</TableColumn>
          <TableColumn className="hidden md:table-cell">Album</TableColumn>
          <TableColumn className="w-20 text-right">Duration</TableColumn>
        </TableHeader>

        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No tracks found in this playlist</p>
            </div>
          }
        >
          {loading
            ? Array.from({ length: 10 }, (_, i) => (
                <TrackSkeleton key={`skeleton-${i}`} />
              ))
            : tracks.map((track, index) => (
                <TrackRow
                  key={track.track.id}
                  track={track.track}
                  index={index}
                  onPlay={onPlay}
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
