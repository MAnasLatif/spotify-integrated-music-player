import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { getCurrentUser, handleSpotifyError } from '@/lib/spotify';

export async function GET() {
  try {
    apiLogger.request('GET', '/api/spotify/me');

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      apiLogger.response('GET', '/api/spotify/me', 401);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 },
      );
    }

    const user = await getCurrentUser(session.accessToken);

    // Return only the fields needed by the UI
    const userResponse = {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      images: user.images,
      followers: user.followers,
      country: user.country,
      product: user.product,
    };

    apiLogger.response('GET', '/api/spotify/me', 200, { userId: user.id });
    return NextResponse.json(userResponse);
  } catch (error) {
    const { message, status = 500 } = handleSpotifyError(error);

    apiLogger.error('/api/spotify/me', error);

    return NextResponse.json(
      { error: 'Spotify API Error', message },
      { status },
    );
  }
}
