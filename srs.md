# SRS — Next.js 15 (App Router) + TypeScript + TailwindCSS (HeroUI) + NextAuth + PostgreSQL (Prisma)

> **Purpose**
> This Software Requirements Specification (SRS) defines scope, behavior, data model, and implementation guidelines (optimized for GitHub Copilot) for a modern web app built with **Next.js 15 App Router**, **TypeScript**, **TailwindCSS** with **HeroUI**, **NextAuth** for auth, and **PostgreSQL** via **Prisma**.
> The sample domain is a **Spotify-integrated music player** (login, fetch playlists/tracks, browser playback), but the structure is reusable for similar apps.

---

## 1. Goals & Non-Goals

**Goals**

- OAuth login with Spotify via NextAuth.
- Display user profile; fetch & browse playlists and tracks.
- Web Playback in browser (Premium required).
- Responsive, accessible UI using Tailwind + HeroUI.
- Secure token handling with refresh; minimal persistence using Postgres.

**Non-Goals**

- Social features (comments, sharing).
- Admin panel and complex RBAC.
- Long-term Spotify data warehousing (only cache small bits if needed).

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router), React 18+, TypeScript
- **Auth**: NextAuth (OAuth with Spotify; Prisma Adapter)
- **DB**: PostgreSQL (Neon/RDS/CloudSQL), **Prisma** ORM
- **UI**: TailwindCSS + **HeroUI** (component library)
- **HTTP**: Fetch API; lightweight API routes (no separate backend)
- **Playback**: Spotify Web Playback SDK (client-only)

---

## 3. High-Level Architecture

- **App Router** with server components by default; client components only for interactive UI / SDK.
- **API Routes** under `app/api/*` for auth callbacks, token utilities, and server-side calls to Spotify if needed.
- **NextAuth** with Prisma Adapter for Users/Accounts/Sessions.
- **Prisma** as DB layer (`/prisma/schema.prisma`).
- **Caching**: Edge-safe caching for public assets; revalidation for user data endpoints (short TTL).
- **Secrets** in `.env` / Vercel project env.

---

## 4. User Stories & Acceptance Criteria

1. **Login with Spotify**

- As a user, I can log in via Spotify OAuth.
- **AC**: After login, my display name & avatar show in the header; token refresh works without manual re-login.

2. **View Playlists**

- As a logged-in user, I can see my playlists with name, cover, and track count.
- **AC**: Pagination (20 per page) or lazy-load; graceful skeleton/loading.

3. **Select Playlist & View Tracks**

- As a user, I can open a playlist and see its tracks with album art, name, artists, and duration.
- **AC**: Tracks load within 1–2s on decent network; errors surfaced with toasts.

4. **Playback Controls**

- As a Premium user, I can play/pause, previous/next, and play individual tracks.
- **AC**: The in-browser device is transferred & active; progress updates; friendly message if not Premium.

5. **Logout**

- As a user, I can log out.
- **AC**: Session is cleared; protected pages redirect to login.

---

## 5. Information Architecture & Routing

```
/                  -> Home (login / playlists)
/playlist/[id]     -> Playlist details & track list
/api/auth/[...nextauth]
/api/spotify/*     -> (Optional) server proxies for Spotify calls
```

**Navigation**

- Header: App title, user avatar/name (when authed), Login/Logout button.
- Main: Grid of playlists; clicking opens details page.
- Player bar/section on playlist page.

---

## 6. Data Model (Prisma)

> Uses the official **NextAuth Prisma Adapter** models plus app-specific tables.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- NextAuth core ---
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  emailVerified DateTime?
  image         String?

  accounts      Account[]
  sessions      Session[]

  // App-specific
  preferences   Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String

  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// --- App cache (optional, small) ---
model SpotifyCache {
  id          String   @id @default(cuid())
  userId      String   @unique
  me          Json?
  playlists   Json?     // last fetched page / summary
  updatedAt   DateTime  @updatedAt
  createdAt   DateTime  @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 7. Auth & Security

- **NextAuth Provider**: Spotify OAuth.
- **Session Strategy**: JWT (default) or Database sessions (both supported by Prisma).
- **Token Refresh**: Implement refresh in JWT callback using Spotify token endpoint.
- **CSRF**: Handled by NextAuth.
- **RLS**: Not required; app-level authorization (only read own data).
- **Secrets**: Stored in `.env` and deployment environment.

---

## 8. Environment Variables

```bash
# Base
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_long_random_string

# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_AUTH_SCOPES="user-read-email user-read-private user-read-playback-state user-modify-playback-state streaming playlist-read-private playlist-read-collaborative"
```

Add redirect URI in Spotify dashboard:
`http://localhost:3000/api/auth/callback/spotify`

---

## 9. Folder Structure

```
app/
  api/
    auth/
      [...nextauth]/route.ts
    spotify/
      me/route.ts
      playlists/route.ts
      playlists/[id]/tracks/route.ts
  (marketing)/page.tsx           // optional
  layout.tsx
  page.tsx
  playlist/[id]/page.tsx

components/
  AuthButton.tsx
  Header.tsx
  PlaylistGrid.tsx
  TrackList.tsx
  Player.tsx

lib/
  auth.ts
  prisma.ts
  spotify.ts
  logger.ts
  utils.ts

styles/
  globals.css

prisma/
  schema.prisma

types/
  spotify.ts
```

---

## 10. API Contracts (App Routes)

### `GET /api/spotify/me`

- **Auth**: required
- **Resp**: `{ id, display_name, images, email }`
- **Errors**: `401`, `502` (Spotify error)

### `GET /api/spotify/playlists?limit=20&cursor=...`

- **Auth**: required
- **Resp**: `{ items: Playlist[], next?: string }`

### `GET /api/spotify/playlists/:id/tracks?limit=100&cursor=...`

- **Auth**: required
- **Resp**: `{ items: TrackItem[], next?: string }`

> These may proxy Spotify or call Spotify client-side; choose server routes if you want to hide tokens and unify error handling.

---

## 11. UI/UX Requirements

- **HeroUI** components (Buttons, Cards, Avatar, Navbar, Modal), styled with Tailwind.
- **State**: Use server components for data where possible; client components for interactive playback & buttons.
- **Responsive**: Mobile-first; grid collapses to 2 cols on small screens.
- **A11y**: Focus states, ARIA labels for player controls, semantic headings.
- **Empty/Loading/Error**: Skeletons on playlist grid & track list; toast on errors.

---

## 12. Playback Behavior

- Load Spotify Web Playback SDK on demand (`<script src="https://sdk.scdn.co/spotify-player.js">`).
- Initialize player with `getOAuthToken` and volume 0.5.
- On **ready**: capture `device_id`, call `PUT /me/player` (transferPlayback) then `PUT /me/player/play`.
- Controls: **Play/Pause**, **Next**, **Previous**, **Play track**.
- Handle **403**/account errors → “Premium required or no active device”.

---

## 13. Error Handling

- **401**: Session expired → sign-in redirect.
- **403**: Playback not allowed → Premium message.
- **429**: Backoff and retry with jitter.
- **5xx**: Show toast “Spotify unavailable, try again”.

---

## 14. Performance & Caching

- Use `fetch({ cache: 'no-store' })` or short `revalidate` for user-specific endpoints.
- Avoid over-fetching; page playlists 20 at a time.
- Lazy-load tracks on playlist page.

---

## 15. Accessibility

- Keyboard-accessible controls.
- Visible focus rings (`focus-visible`).
- Alt text for avatars/album art.
- Sufficient color contrast in dark mode.

---

## 16. Testing

- **Unit**: utilities & Prisma mappers.
- **Component**: React Testing Library for PlaylistGrid, TrackList, Player controls.
- **Integration**: Auth flow (mock NextAuth), API routes (mock Spotify).
- **E2E**: Playwright basic login + playlist list.

---

## 17. Deployment

- **Vercel** for frontend + API routes.
- **Postgres**: Neon/Render/Railway.
- Set env vars in Vercel; run `prisma migrate deploy`.
- Add Vercel URL to Spotify redirect URIs.

---

## 18. Copilot Guidelines (Make Copilot Awesome)

> Put these patterns as **file headers** / **JSDoc** so Copilot follows them.

### 18.1 General Coding Conventions

```ts
/**
 * Rules for this file:
 * - TypeScript strict mode; no `any` unless justified.
 * - Server Components by default; use 'use client' only when needed.
 * - Keep functions pure; side-effects isolated.
 * - Prefer small, named components and explicit props types.
 * - Accessibility: ARIA labels, keyboard handlers.
 */
```

### 18.2 Component Prompt Template

```ts
/**
 * Create a React client component with:
 * - Props: define a Props type.
 * - Tailwind + HeroUI components (Button, Card).
 * - Accessibility (aria-labels for controls).
 * - Loading + error UI states.
 * - No inline styles; use Tailwind classes.
 * - Export default component.
 */
```

### 18.3 Server Action / API Route Prompt

```ts
/**
 * Implement a Next.js App Router route handler:
 * - Method: GET.
 * - Auth: read session via auth() and reject if unauthenticated.
 * - Behavior: call Spotify Web API with user's access token.
 * - Errors: Map 401/403/429/5xx to JSON with proper status.
 * - Return: JSON with minimal fields needed by UI.
 */
```

### 18.4 Prisma Access Pattern

```ts
/**
 * Data access rules:
 * - Use a singleton Prisma client (lib/prisma.ts) to avoid hot-reload leaks.
 * - Never expose raw DB errors to clients.
 * - Use narrow selects; avoid returning unnecessary fields.
 */
```

### 18.5 NextAuth Callback Pattern

```ts
/**
 * Auth callbacks:
 * - jwt(): attach accessToken, accessTokenExpires, refreshToken.
 * - If expired, refresh with Spotify token endpoint.
 * - session(): expose accessToken + error to client.
 */
```

### 18.6 UI/UX Pattern (Playlists)

```ts
/**
 * Build a responsive playlist grid:
 * - 2 cols on small, 4 on md+.
 * - Card shows cover, name (truncate), track count (muted).
 * - Click selects playlist and navigates to /playlist/[id].
 */
```

### 18.7 Error/Loading UI Snippets

```tsx
// Loading skeleton
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[...Array(8)].map((_, i) => (
    <div key={i} className="h-48 animate-pulse rounded-lg bg-neutral-900" />
  ))}
</div>;

// Toast helper (pseudo)
showToast({ title: 'Playback error', description: message, variant: 'error' });
```

---

## 19. Definition of Done ( per story )

- All AC met and tested.
- Types complete; no `any` leaks.
- Lint passes; no console errors.
- A11y checks pass for interactive elements.
- Env vars documented in README.
- Happy-path E2E (login → playlists → track play) succeeds; non-Premium path shows proper message.

---

## 20. Notes & Constraints

- Spotify playback requires **Premium**; handle “no active device” gracefully.
- Keep scopes minimal; document required scopes in README.
- Prefer server-side Spotify calls when you need to hide tokens or add rate-limiting.

---
