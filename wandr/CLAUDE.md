# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Dev server at http://localhost:3000
npm run build   # Production build
npm test        # Run Jest tests
```

## Product vision

Wandr is a web + mobile app for tracking the places you visit during a trip — automatic place detection via GPS/Google Maps on mobile, manual entry everywhere — with finished trips shareable as itineraries to friends. **`docs/wandr-overview.md` is the single-file product + technical overview (vision, feature inventory, architecture, data model, roadmap) — keep it updated when features land.** `docs/vision.md` has the original vision notes.

Current product state: the full frontend loop works on both data modes — trips with dates/named days/media/date-visited, Google Places (New) autocomplete with manual fallback and city/country extraction, Friends/Everyone feed tabs, unified saves surfacing in Profile → Places, tabbed searchable profiles (own + public), follow-gated privacy levels (public/semi/private), dark + bright themes, and a Settings page. **Planning features (roadmap step 3)**: saves split into Been / Want-to-go lists (defaults: self-logged → been, saved-from-others → want-to-go; flippable; wishlist excluded from Countries/Cities stats); trips have derived past/live/planned status (`src/lib/tripStatus.js` — dates are truth, never a manual picker), grouped Traveling now / Dream plans / Past trips; dream plans carry a destination and surface matching want-to-go suggestions for one-tap itinerary adds; friends' itinerary stops have a Want-to-go save button.

## Architecture

Wandr is a social travel app built with Create React App + React Router v7. **Data layer**: every page loads data through async functions in `src/services/`, which run real Supabase queries when `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` are set in `.env.local`, and otherwise fall back to the static seed data in `src/data.js`. SQL schema + seed data live in `supabase/`; setup steps in `docs/backend-setup.md`. A frontend audit with per-page target flows is in `docs/frontend-flows.md`.

### Source layout

```
src/
├── components/          # Shared UI: Avatar, Stars, Toast, AddPlaceModal,
│                        # PlaceDetailModal (shared place card: community info via
│                        # services/community.js, want-to-go save, add-to-trip picker;
│                        # opened from Explore, feed posts, own trip stops, friends'
│                        # trip stops/places)
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
│   ├── places.js        # city/country extraction: Places addressComponents parsing,
│   │                    # manual "City, Country" parsing, country-flag helpers
│   ├── collections.js   # shared rollups: trip stops → places → Countries/Cities lists
│   ├── share.js         # navigator.share with clipboard fallback
│   └── supabase.js      # Supabase client (null when env vars absent → static fallback)
├── pages/
│   ├── Feed/            # Friends/Everyone tabs, likes, saves, comments, add place
│   ├── Explore/         # searchable place list + Google Map; saves feed into Profile
│   ├── Trips/           # create (title + start/end dates + cover), named/editable day
│   │                    # descriptions, add/reorder/remove stops, media thumbs,
│   │                    # share links, map view (fit bounds), print-to-PDF
│   ├── Profile/         # left: stats + condensed badges/style; right: Trips/Places/
│   │                    # Countries/Cities tabs with search + category filters;
│   │                    # saves removable from Places tab
│   ├── People/          # search travelers, follow/unfollow, discover list
│   ├── Settings/        # account fields, dark/bright theme, privacy level picker
│   │                    # (public/semi/private), notification toggles, sign out
│   ├── PublicProfile/   # /user/:username — same tabbed layout as own profile;
│   │                    # content gated by privacy: semi needs follow, private
│   │                    # needs mutual follow (stats always visible)
│   ├── Login/           # Google OAuth + email sign-in
│   └── Onboarding/      # 3-step wizard: username → travel style → follow friends
├── services/            # async data layer: Supabase queries with data.js fallback
│                        # (auth, users, follows, posts, trips, saves, media)
│                        # saves.js unifies feed/explore saves + own posts for
│                        # Profile → Places (explore saves are session-local);
│                        # media.js uploads to the Supabase `media` storage bucket
│                        # (object URLs in fallback)
├── data.js              # Static seed data — fallback + config; CATEGORIES has 9
│                        # entries incl. Lodging, Logistics, Landmarks (CAT_BG too)
└── styles.css           # Complete design system, dark + bright themes
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

All code is in place — client, schema (incl. `users.privacy`, `places` city/country/visited_on/media columns, trip dates, and the public `media` storage bucket), seed data, services, auth. To activate:
1. Create a Supabase project; run `supabase/schema.sql` then `supabase/seed.sql` in its SQL Editor
2. Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in `.env.local` and restart the dev server

Details (including how to log in as the seeded user): `docs/backend-setup.md`. Google key needs **Maps JavaScript API** + **Places API (New)** enabled.
