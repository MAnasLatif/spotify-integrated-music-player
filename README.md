# Spotify Integrated Music Player

A modern, responsive Spotify-integrated music player built with **Next.js 15**, **TypeScript**, **TailwindCSS**, **HeroUI**, **NextAuth**, and **PostgreSQL** via **Prisma**.

## Features

- 🎵 **Spotify OAuth Integration** - Secure login with your Spotify account
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎶 **Browse Playlists** - View and explore your Spotify playlists
- 🎧 **Web Playback** - Play music directly in your browser (Premium required)
- 🎚️ **Playback Controls** - Play, pause, skip, volume control
- 🌙 **Theme Support** - Light and dark mode
- ♿ **Accessible** - Built with accessibility best practices
- 🚀 **Modern Stack** - Latest Next.js with App Router, TypeScript, and more

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + HeroUI
- **Authentication**: NextAuth.js with Spotify OAuth
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React Hooks + NextAuth Session
- **Icons**: Lucide React
- **Theme**: next-themes

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Spotify Developer account
- A PostgreSQL database (local or hosted)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd spotify-integrated-music-player
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add these redirect URIs:
   - `http://localhost:3000/api/auth/callback/spotify` (development)
   - `https://your-domain.com/api/auth/callback/spotify` (production)
4. Note your Client ID and Client Secret

### 4. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Base Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/spotify_player

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_long_random_string_here_minimum_32_characters

# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 5. Set Up Database

Generate and run Prisma migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run prisma:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Scripts

| Script                    | Description                             |
| ------------------------- | --------------------------------------- |
| `npm run dev`             | Start development server with Turbopack |
| `npm run build`           | Build for production                    |
| `npm run start`           | Start production server                 |
| `npm run lint`            | Run ESLint                              |
| `npm run lint:fix`        | Fix ESLint issues                       |
| `npm run format`          | Format code with Prettier               |
| `npm run prisma:migrate`  | Run Prisma migrations                   |
| `npm run prisma:generate` | Generate Prisma client                  |
| `npm run prisma:studio`   | Open Prisma Studio                      |
| `npm run prisma:deploy`   | Deploy migrations (production)          |
| `npm run prisma:reset`    | Reset database                          |
| `npm run prisma:seed`     | Seed database                           |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   └── spotify/      # Spotify API proxies
│   ├── auth/error/       # Auth error page
│   ├── playlist/[id]/    # Playlist detail page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # Client providers
├── components/            # React components
│   ├── AuthButton.tsx    # Authentication button
│   ├── Header.tsx        # App header/navbar
│   ├── PlaylistGrid.tsx  # Playlist grid display
│   ├── Player.tsx        # Spotify Web Playback SDK player
│   └── TrackList.tsx     # Track list component
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── logger.ts         # Logging utilities
│   ├── prisma.ts         # Prisma client
│   ├── spotify.ts        # Spotify API client
│   └── utils.ts          # General utilities
├── types/                 # TypeScript type definitions
│   ├── next-auth.d.ts    # NextAuth type extensions
│   └── spotify.ts        # Spotify API types
└── styles/
    └── globals.css       # Global styles

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seed script
```

## Key Features

### Authentication

- Spotify OAuth integration via NextAuth
- Automatic token refresh
- Session persistence
- Error handling for auth failures

### Music Playback

- Spotify Web Playbook SDK integration
- Play/pause controls
- Track navigation (previous/next)
- Volume control
- Progress tracking
- Premium account requirement handling

### User Interface

- Responsive grid layout for playlists
- Accessible controls and navigation
- Loading states and error handling
- Dark/light theme support
- Mobile-optimized design

### API Integration

- Server-side Spotify API calls
- Rate limiting and error handling
- Efficient data fetching
- Proper error responses

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

Make sure to update your Spotify app settings with the production URL.

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables Reference

| Variable                | Description                          | Required |
| ----------------------- | ------------------------------------ | -------- |
| `NEXT_PUBLIC_APP_URL`   | Your app's URL                       | Yes      |
| `DATABASE_URL`          | PostgreSQL connection string         | Yes      |
| `NEXTAUTH_URL`          | NextAuth base URL                    | Yes      |
| `NEXTAUTH_SECRET`       | NextAuth encryption secret           | Yes      |
| `SPOTIFY_CLIENT_ID`     | Spotify app client ID                | Yes      |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret            | Yes      |
| `NODE_ENV`              | Environment (development/production) | No       |

## Spotify API Scopes

The app requests these Spotify API scopes:

- `user-read-email` - Read user email
- `user-read-private` - Read user profile
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Control playback
- `streaming` - Play music in the browser
- `playlist-read-private` - Read private playlists
- `playlist-read-collaborative` - Read collaborative playlists

## Troubleshooting

### Common Issues

1. **"Premium Required" Error**
   - Spotify Web Playback requires a Premium account
   - Free accounts can browse but not play music

2. **Authentication Errors**
   - Check Spotify app redirect URIs
   - Verify environment variables
   - Ensure NEXTAUTH_SECRET is set

3. **Database Connection Issues**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Run `prisma:generate` after schema changes

4. **Player Not Loading**
   - Check browser console for errors
   - Ensure Spotify Web Playbook SDK is loaded
   - Verify Premium account status

### Development Tips

- Use Prisma Studio to inspect database: `npm run prisma:studio`
- Check logs in browser console and server terminal
- Use the Spotify Web API Console for testing API calls
- Enable verbose logging in development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for music data
- [HeroUI](https://heroui.com/) for beautiful components
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Prisma](https://www.prisma.io/) for database management
