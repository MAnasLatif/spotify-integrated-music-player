import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { getUserPlaylists, handleSpotifyError } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    apiLogger.request('GET', '/api/spotify/playlists', { limit, offset });

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      apiLogger.response('GET', '/api/spotify/playlists', 401);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 },
      );
    }

    const playlists = await getUserPlaylists(
      session.accessToken,
      limit,
      offset,
    );

    // Return paginated response
    const response = {
      items: playlists.items.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        images: playlist.images,
        tracks: { total: playlist.tracks.total },
        owner: {
          id: playlist.owner.id,
          display_name: playlist.owner.display_name,
        },
        public: playlist.public,
        collaborative: playlist.collaborative,
      })),
      next: playlists.next,
      total: playlists.total,
      limit: playlists.limit,
      offset: playlists.offset,
    };

    apiLogger.response('GET', '/api/spotify/playlists', 200, {
      count: response.items.length,
      total: response.total,
    });

    return NextResponse.json(response);
  } catch (error) {
    const { message, status = 500 } = handleSpotifyError(error);

    apiLogger.error('/api/spotify/playlists', error);

    return NextResponse.json(
      { error: 'Spotify API Error', message },
      { status },
    );
  }
}
