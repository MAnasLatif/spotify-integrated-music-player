/**
 * Spotify Web API types
 * Rules for this file:
 * - Define minimal types needed for the app
 * - Match Spotify API response structure
 * - Use consistent naming with Spotify documentation
 * - Include only fields actually used in the UI
 */

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  images: SpotifyImage[];
  followers: {
    total: number;
  };
  country?: string;
  product?: string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: {
    total: number;
  };
  owner: {
    id: string;
    display_name: string | null;
  };
  public: boolean | null;
  collaborative: boolean;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  preview_url: string | null;
  track_number: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
  is_playable?: boolean;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  added_by: {
    id: string;
  };
  is_local: boolean;
  track: SpotifyTrack;
}

// API Response wrappers
export interface SpotifyPaginatedResponse<T> {
  items: T[];
  next: string | null;
  previous: string | null;
  total: number;
  limit: number;
  offset: number;
}

export type SpotifyPlaylistsResponse =
  SpotifyPaginatedResponse<SpotifyPlaylist>;
export type SpotifyTracksResponse =
  SpotifyPaginatedResponse<SpotifyPlaylistTrack>;

// Playback SDK types
export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  getVolume(): Promise<number>;
  nextTrack(): Promise<void>;
  pause(): Promise<void>;
  previousTrack(): Promise<void>;
  resume(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  setName(name: string): Promise<void>;
  setVolume(volume: number): Promise<void>;
  togglePlay(): Promise<void>;
  on(event: string, callback: (data: any) => void): void;
  removeListener(event: string): void;
}

export interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

// Error types
export interface SpotifyError {
  status: number;
  message: string;
}
