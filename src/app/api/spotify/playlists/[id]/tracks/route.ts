/**
 * Spotify playlist tracks API route
 * Implement a Next.js App Router route handler:
 * - Method: GET
 * - Auth: read session via getServerSession and reject if unauthenticated
 * - Behavior: call Spotify Web API with user's access token
 * - Errors: Map 401/403/429/5xx to JSON with proper status
 * - Return: JSON with paginated tracks data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { getPlaylistTracks, handleSpotifyError } from '@/lib/spotify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: playlistId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    apiLogger.request('GET', `/api/spotify/playlists/${playlistId}/tracks`, {
      playlistId,
      limit,
      offset,
    });

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      apiLogger.response(
        'GET',
        `/api/spotify/playlists/${playlistId}/tracks`,
        401,
      );
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 },
      );
    }

    const tracks = await getPlaylistTracks(
      playlistId,
      session.accessToken,
      limit,
      offset,
    );

    // Return paginated response with minimal track data
    const response = {
      items: tracks.items
        .filter((item) => item.track && !item.is_local) // Filter out local files and null tracks
        .map((item) => ({
          added_at: item.added_at,
          track: {
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map((artist) => ({
              id: artist.id,
              name: artist.name,
            })),
            album: {
              id: item.track.album.id,
              name: item.track.album.name,
              images: item.track.album.images,
            },
            duration_ms: item.track.duration_ms,
            preview_url: item.track.preview_url,
            uri: item.track.uri,
            track_number: item.track.track_number,
            explicit: item.track.explicit,
          },
        })),
      next: tracks.next,
      total: tracks.total,
      limit: tracks.limit,
      offset: tracks.offset,
    };

    apiLogger.response(
      'GET',
      `/api/spotify/playlists/${playlistId}/tracks`,
      200,
      {
        playlistId,
        count: response.items.length,
        total: response.total,
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    const { message, status = 500 } = handleSpotifyError(error);

    apiLogger.error(`/api/spotify/playlists/${playlistId}/tracks`, error);

    return NextResponse.json(
      { error: 'Spotify API Error', message },
      { status },
    );
  }
}
