# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Dev server at http://localhost:3000
npm run build   # Production build
npm test        # Run Jest tests
```

## Architecture

Wandr is a social travel app built with Create React App + React Router v6. It is currently a **frontend-only app** — all data is static; no backend is connected yet.

### Source layout

```
src/
├── components/          # Shared UI: Avatar, Stars, Toast, AddPlaceModal
├── context/
│   ├── AuthContext.js   # user + profile state; signInWithGoogle, signOut, completeOnboarding
│   └── ToastContext.js  # global showToast / clearToast
├── layouts/
│   ├── AppLayout.js     # sidebar nav + <Outlet> — wraps authenticated app pages
│   └── AuthLayout.js    # bare shell — wraps login and onboarding
├── lib/
│   └── supabase.js      # Supabase client stub (not yet active)
├── pages/
│   ├── Feed/            # owns post state (likes, saves, add place)
│   ├── Explore/         # filterable place list + map
│   ├── Trips/           # trip itinerary builder
│   ├── Profile/         # stats, badges, travel style
│   ├── Login/           # Google OAuth entry point
│   └── Onboarding/      # 3-step wizard: username → travel style → follow friends
├── services/            # Supabase query stubs (auth.js, posts.js, trips.js)
├── data.js              # Static seed data (POSTS, TRIPS, PROFILE, FRIENDS, etc.)
└── styles.css           # Complete design system (~500 lines, dark theme)
```

### Routing

Defined in `App.js`. Two route groups:

| Path | Layout | Guard |
|---|---|---|
| `/login` | AuthLayout | public |
| `/onboarding` | AuthLayout | user exists, no profile |
| `/`, `/explore`, `/trips`, `/profile` | AppLayout | user + profile required |

`PrivateRoute` redirects unauthenticated users to `/login`. `OnboardingRoute` redirects users who already have a profile back to `/`.

### State management

- **Auth state** — `AuthContext` (user, profile). Currently stubs; replace with `supabase.auth` when wiring up.
- **Toast** — `ToastContext`. Call `useToast().showToast(msg)` from any page or component.
- **Post state** — local to `FeedPage` (likes, saves, new posts).
- **Trip state** — local to `TripsPage`.

### Design system

CSS variables in `:root` in `styles.css`:
- Colors: `--bg` (#0e0e0e), `--text`, `--text-2`, `--text-3`, `--accent` (coral #E8A87C), `--accent2` (teal #6BBFA0), `--accent3` (purple)
- Typography: Playfair Display (`--font-display`), DM Sans (`--font-body`)
- Border radii: `--r` (12px), `--r2` (18px), `--r3` (24px)

Page layouts use fixed-width left panels alongside a main/map area, collapsing below 900px.

### Planned backend (not yet implemented)

`docs/backend-setup.md` describes the Supabase + Postgres migration. The seed data schema in `data.js` mirrors the planned SQL tables. To activate:
1. Install `@supabase/supabase-js`
2. Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in `.env`
3. Uncomment `src/lib/supabase.js`
4. Replace stubs in `src/services/` and `src/context/AuthContext.js` with real calls
