/**
 * Nimport type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'tAuth type extensions for Spotify integration
 * Rules for this file:
 * - Extend default NextAuth types with Spotify-specific fields
 * - Keep types minimal and focused on what the app needs
 * - Use proper TypeScript module augmentation
 */

import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    error?: string;
  }
}
