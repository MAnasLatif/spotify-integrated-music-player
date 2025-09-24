'use client';

import { Button, Card, CardBody, CardFooter } from '@heroui/react';
import { Music, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { formatNumber, truncateText } from '@/lib/utils';
import type { SpotifyPlaylist } from '@/types/spotify';

interface PlaylistGridProps {
  playlists: SpotifyPlaylist[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onClick: (playlistId: string) => void;
}

function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = playlist.images?.[0]?.url;

  const handleClick = () => {
    onClick(playlist.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus-visible:scale-[1.02] focus-visible:outline-2 focus-visible:outline-primary bg-card border-border"
      isPressable
      onPress={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${playlist.name} playlist with ${playlist.tracks.total} tracks`}
    >
      <CardBody className="p-0">
        <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/80 rounded-t-lg overflow-hidden">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={`${playlist.name} playlist cover`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music
                className="h-12 w-12 text-muted-foreground group-hover:text-green-500 transition-colors"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        ß
      </CardBody>

      <CardFooter className="flex flex-col items-start p-4 gap-2">
        <h3 className="font-semibold text-sm text-left w-full text-foreground group-hover:text-green-500 transition-colors">
          {truncateText(playlist.name, 40)}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatNumber(playlist.tracks.total)} track
          {playlist.tracks.total !== 1 ? 's' : ''}
        </p>
        {playlist.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2">
            {truncateText(playlist.description, 60)}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
      </div>
    </div>
  );
}

export default function PlaylistGrid({
  playlists,
  loading = false,
  error = null,
  onRetry,
  className,
}: PlaylistGridProps) {
  const router = useRouter();

  const handlePlaylistClick = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
  };

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load playlists
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        {onRetry && (
          <Button
            color="primary"
            variant="bordered"
            onClick={onRetry}
            startContent={<RefreshCw className="h-4 w-4" />}
            aria-label="Retry loading playlists"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <PlaylistSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No playlists found
        </h3>
        <p className="text-gray-500">
          Create some playlists on Spotify to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}
    >
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onClick={handlePlaylistClick}
        />
      ))}
    </div>
  );
}
