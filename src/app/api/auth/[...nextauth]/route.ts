/**
 * NextAuth API route handler
 * Implement a Next.js App Router route handler:
 * - Method: GET/POST
 * - Auth: NextAuth configuration with Spotify provider
 * - Behavior: Handle OAuth flow with Spotify
 * - Return: NextAuth responses for authentication
 */

import NextAuth from 'next-auth';

import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
