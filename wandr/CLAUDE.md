# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Dev server at http://localhost:3000
npm run build   # Production build
npm test        # Run Jest tests
```

## Product vision

Wandr is a web + mobile app for tracking the places you visit during a trip — automatic place detection via GPS/Google Maps on mobile, manual entry everywhere — with finished trips shareable as itineraries to friends. See `docs/vision.md` for the full vision, data-model implications, and roadmap (Supabase backend → Places-powered manual entry → shareable trip pages → mobile auto-detection).

## Architecture

Wandr is a social travel app built with Create React App + React Router v7. **Data layer**: every page loads data through async functions in `src/services/`, which run real Supabase queries when `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` are set in `.env.local`, and otherwise fall back to the static seed data in `src/data.js`. SQL schema + seed data live in `supabase/`; setup steps in `docs/backend-setup.md`. A frontend audit with per-page target flows is in `docs/frontend-flows.md`.

### Source layout

```
src/
├── components/          # Shared UI: Avatar, Stars, Toast, AddPlaceModal
├── context/
│   ├── AuthContext.js   # user + profile state; signIn*, signOut, completeOnboarding, updateProfile
│   ├── ThemeContext.js  # dark/bright theme; sets data-theme on <html>, persists to localStorage
│   └── ToastContext.js  # global showToast / clearToast
├── layouts/
│   ├── AppLayout.js     # sidebar nav + <Outlet> — wraps authenticated app pages
│   └── AuthLayout.js    # bare shell — wraps login and onboarding
├── lib/
│   ├── googleMaps.js    # modern importLibrary loader (needs REACT_APP_GOOGLE_MAPS_API_KEY);
│   │                    # exposes loadGoogleMaps() and loadPlacesLibrary() (Places API New)
│   ├── share.js         # navigator.share with clipboard fallback
│   └── supabase.js      # Supabase client (null when env vars absent → static fallback)
├── pages/
│   ├── Feed/            # Friends/Everyone tabs, likes, saves, comments, add place
│   ├── Explore/         # searchable place list + Google Map; saves feed into Profile
│   ├── Trips/           # trip itinerary builder (create, add stops, share, map view)
│   ├── Profile/         # left: stats + condensed badges/style; right: Trips/Places/
│   │                    # Countries/Cities tabs with search + category filters
│   ├── People/          # search travelers + following list
│   ├── Settings/        # account fields, theme picker, notification/privacy toggles
│   ├── PublicProfile/   # /user/:username — other users' trips & style
│   ├── Login/           # Google OAuth + email sign-in
│   └── Onboarding/      # 3-step wizard: username → travel style → follow friends
├── services/            # async data layer: Supabase queries with data.js fallback
│                        # (auth, users, follows, posts, trips, saves)
│                        # saves.js unifies feed/explore saves + own posts for
│                        # Profile → Places (explore saves are session-local)
├── data.js              # Static seed data — fallback + config (CATEGORIES, BADGES)
└── styles.css           # Complete design system (~500 lines, dark theme)
```

### Routing

Defined in `App.js`. Two route groups:

| Path | Layout | Guard |
|---|---|---|
| `/login` | AuthLayout | public |
| `/onboarding` | AuthLayout | user exists, no profile |
| `/`, `/explore`, `/trips`, `/people`, `/profile`, `/settings`, `/user/:username` | AppLayout | user + profile required |

`PrivateRoute` redirects unauthenticated users to `/login`. `OnboardingRoute` redirects users who already have a profile back to `/`.

### State management

- **Auth state** — `AuthContext` (user, profile, loading). Uses `supabase.auth` when configured (session restore, OAuth, email/password); otherwise in-memory dev stubs (any email/password signs in as seed user '1').
- **Toast** — `ToastContext`. Call `useToast().showToast(msg)` from any page or component.
- **Post/trip state** — fetched per page from `src/services/`, held in local page state; mutations (like/save/create) write through the services.

### Design system

CSS variables in `:root` in `styles.css`:
- Colors: `--bg` (#0e0e0e), `--text`, `--text-2`, `--text-3`, `--accent` (coral #E8A87C), `--accent2` (teal #6BBFA0), `--accent3` (purple)
- Typography: Playfair Display (`--font-display`), DM Sans (`--font-body`)
- Border radii: `--r` (12px), `--r2` (18px), `--r3` (24px)

**Theming**: `:root[data-theme="light"]` in styles.css overrides the variables for the bright theme; `ThemeContext` stamps `data-theme` on `<html>` and persists to localStorage (`wandr-theme`). Never hardcode surface/text colors — always use the variables so both themes work (an inline body background in `public/index.html` once masked the light theme entirely). The Google Map picks its `colorScheme` from the theme at mount.

Page layouts use fixed-width left panels alongside a main/map area, collapsing below 900px.

### Backend (wired, awaiting a Supabase project)

All code is in place — client, schema, seed data, services, auth. To activate:
1. Create a Supabase project; run `supabase/schema.sql` then `supabase/seed.sql` in its SQL Editor
2. Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in `.env.local` and restart the dev server

Details (including how to log in as the seeded user): `docs/backend-setup.md`.
