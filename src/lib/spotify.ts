import type {
  SpotifyError,
  SpotifyPlaylistsResponse,
  SpotifyTracksResponse,
  SpotifyUser,
} from '@/types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

class SpotifyAPIError extends Error {
  constructor(
    public status: number,
    public spotifyError: SpotifyError,
    message?: string,
  ) {
    super(message || spotifyError.message);
    this.name = 'SpotifyAPIError';
  }
}

/**
 * Base fetch wrapper for Spotify API calls
 */
async function spotifyFetch(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${SPOTIFY_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      status: response.status,
      message: response.statusText,
    }));

    throw new SpotifyAPIError(response.status, errorData);
  }

  return response;
}

/**
 * Get current user's profile
 */
export async function getCurrentUser(
  accessToken: string,
): Promise<SpotifyUser> {
  const response = await spotifyFetch('/me', accessToken);
  return response.json();
}

/**
 * Get user's playlists with pagination
 */
export async function getUserPlaylists(
  accessToken: string,
  limit: number = 20,
  offset: number = 0,
): Promise<SpotifyPlaylistsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await spotifyFetch(`/me/playlists?${params}`, accessToken);
  return response.json();
}

/**
 * Get playlist tracks with pagination
 */
export async function getPlaylistTracks(
  playlistId: string,
  accessToken: string,
  limit: number = 100,
  offset: number = 0,
): Promise<SpotifyTracksResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    fields:
      'items(added_at,track(id,name,artists(name),album(name,images),duration_ms,preview_url,uri)),next,total',
  });

  const response = await spotifyFetch(
    `/playlists/${playlistId}/tracks?${params}`,
    accessToken,
  );
  return response.json();
}

/**
 * Transfer playback to a device
 */
export async function transferPlayback(
  accessToken: string,
  deviceId: string,
  play: boolean = false,
): Promise<void> {
  await spotifyFetch('/me/player', accessToken, {
    method: 'PUT',
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });
}

/**
 * Start/resume playback
 */
export async function startPlayback(
  accessToken: string,
  deviceId?: string,
  contextUri?: string,
  trackUris?: string[],
): Promise<void> {
  const body: any = {};

  if (contextUri) {
    body.context_uri = contextUri;
  }

  if (trackUris) {
    body.uris = trackUris;
  }

  const params = deviceId ? `?device_id=${deviceId}` : '';

  await spotifyFetch(`/me/player/play${params}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Pause playback
 */
export async function pausePlayback(
  accessToken: string,
  deviceId?: string,
): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : '';

  await spotifyFetch(`/me/player/pause${params}`, accessToken, {
    method: 'PUT',
  });
}

/**
 * Skip to next track
 */
export async function skipToNext(
  accessToken: string,
  deviceId?: string,
): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : '';

  await spotifyFetch(`/me/player/next${params}`, accessToken, {
    method: 'POST',
  });
}

/**
 * Skip to previous track
 */
export async function skipToPrevious(
  accessToken: string,
  deviceId?: string,
): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : '';

  await spotifyFetch(`/me/player/previous${params}`, accessToken, {
    method: 'POST',
  });
}

/**
 * Get user's available devices
 */
export async function getAvailableDevices(accessToken: string) {
  const response = await spotifyFetch('/me/player/devices', accessToken);
  return response.json();
}

/**
 * Helper to handle common Spotify API errors
 */
export function handleSpotifyError(error: unknown): {
  message: string;
  status?: number;
} {
  if (error instanceof SpotifyAPIError) {
    switch (error.status) {
      case 401:
        return { message: 'Authentication required', status: 401 };
      case 403:
        return {
          message: 'Spotify Premium required for playback',
          status: 403,
        };
      case 404:
        return { message: 'Resource not found', status: 404 };
      case 429:
        return {
          message: 'Rate limit exceeded, please try again later',
          status: 429,
        };
      case 502:
      case 503:
        return {
          message: 'Spotify service temporarily unavailable',
          status: error.status,
        };
      default:
        return {
          message: error.message || 'Spotify API error',
          status: error.status,
        };
    }
  }

  return { message: 'An unexpected error occurred' };
}
