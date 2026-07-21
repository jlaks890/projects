# Wandr 🌍

**Track the places you visit during a trip, then share the itinerary with friends.**

Wandr is a social travel app: build day-by-day trip itineraries with Google-powered place search, log photos, ratings, tips, and dates visited, and follow friends to explore their trips, countries, and cities. The long-term vision adds automatic place detection via GPS on mobile — see [docs/wandr-overview.md](docs/wandr-overview.md) for the full product & technical overview.

## Features

- **Feed** — Friends / Everyone tabs, likes, saves, comments, native sharing, photo posts
- **Trips** — create trips with start/end dates, named days, reorderable stops, map view (auto-fit), share links, print-to-PDF
- **Add place** — Google Places (New) autocomplete with graceful manual fallback; date visited; photo/video upload; 9 categories incl. Lodging, Logistics, Landmarks
- **Explore** — searchable place list synced with a theme-aware Google Map
- **Profile** — stats, achievements with progress, travel style; tabbed Trips / Places / Countries / Cities with search + filters; city & country auto-extracted from every place you add
- **People** — follow/unfollow, fully interactive public profiles with three privacy levels (public / semi-private / mutual-follow private)
- **Settings** — account editing, dark/bright theme, privacy level, sign out

## Tech stack

- React 18 (Create React App) + React Router v7
- CSS custom properties — dark + bright themes, no CSS framework
- Google Maps JS API (modern `importLibrary` loader) + Places API (New)
- Supabase — Postgres, Auth (Google OAuth + email), Storage for media
- **Swappable data layer**: all pages read through `src/services/`; with no keys the app runs fully on seed data, with Supabase keys it runs on the real database — same UI either way

## Getting started

```bash
npm install
npm start        # http://localhost:3000 — works immediately on seed data
```

Sign in with any email/password (dev stub) and explore.

### Optional: Google Maps + Places

Create `.env.local`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```
Enable **Maps JavaScript API** and **Places API (New)** for the key in Google Cloud console.

### Optional: real backend (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL Editor run `supabase/schema.sql`, then `supabase/seed.sql`
3. Add to `.env.local` and restart:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

Full steps (including logging in as the seeded user and the media storage bucket): [docs/backend-setup.md](docs/backend-setup.md).

## Project structure

```
src/
├── components/    # AddPlaceModal, Map, Avatar, Stars, Toast
├── context/       # Auth, Theme, Toast providers
├── layouts/       # AppLayout (sidebar), AuthLayout
├── lib/           # googleMaps loader, places (city/country extraction),
│                  # collections (countries/cities rollups), share, supabase client
├── pages/         # Feed, Explore, Trips, Profile, People, PublicProfile,
│                  # Settings, Login, Onboarding
├── services/      # async data layer: Supabase ↔ seed fallback
├── data.js        # seed data + config (categories, badges)
└── styles.css     # design system (dark + bright themes)
supabase/          # schema.sql + seed.sql
docs/              # wandr-overview.md (start here), vision.md,
                   # backend-setup.md, frontend-flows.md
```

## Docs

| Doc | What's in it |
|---|---|
| [docs/wandr-overview.md](docs/wandr-overview.md) | **Single-file product + technical overview** — vision, feature inventory, architecture, data model, roadmap |
| [docs/vision.md](docs/vision.md) | Original product vision and mobile/GPS roadmap |
| [docs/backend-setup.md](docs/backend-setup.md) | Supabase setup guide |
| [docs/frontend-flows.md](docs/frontend-flows.md) | Page-by-page UX flows and implementation status |

## Roadmap

- Persisted comments + notifications
- Public unauthenticated trip share pages (`/trip/:shareToken`)
- Trending computed from real save counts; story viewer
- React Native/Expo mobile app with **automatic visit detection** (geofencing + platform visit APIs), syncing through Supabase
