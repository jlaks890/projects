# Wandr — Product & Technical Overview

*A single-file reference for anyone joining the project: the vision, what's built today, how it's architected, and where it's going. Last updated July 19, 2026.*

---

## 1. Vision

Wandr is a **web + mobile app for tracking the places you visit during a trip and to encourage trip planning, place exploration**. It connects to Google Maps and (eventually) the device's GPS so it can:

1. **Automatically detect places you've visited** while a trip is active — via GPS visit-detection on mobile (future), and
2. **Support manual entry everywhere** — search a place with Google autocomplete or type it in, with photos, ratings, tips, and the date visited.

Once a trip is complete — the full list of places plus logistics — it is **easily shareable as an itinerary to friends**. Around that core loop sits a light social layer: a feed of places friends share, follows, profiles with travel stats, and privacy controls.

Trips are not only records of the past. A trip in Wandr exists in **three modes**:

1. **Past trips** — logged after the fact (manual entry today, imported history later).
2. **Live trips** — tracked in real time while traveling (GPS auto-detection on mobile is the end state).
3. **Future trips — "dream travel plans"** — the aspirational side of the app. The goal is to help people *explore new places and create their own travel plans*: a dream plan starts as a loose collection of places you want to experience and gradually firms up into a dated, day-by-day itinerary you can actually travel — at which point it becomes a live trip.

**The core loop:** dream it (save places you want to go, sketch a plan) → travel it (places accumulate automatically or manually) → finalize → share the itinerary → friends explore it, save places from it, and start dream plans of their own.

### Saving places: "been" vs. "want to go"

Saves are the connective tissue between exploring and planning, so every save lands in one of two lists:

- **Been** — places you've visited (carries date visited, rating, photos; feeds your Countries/Cities stats).
- **Want to go** — the wishlist. Anything discovered in the feed, on Explore, or on a friend's itinerary can be saved here in one tap.

The **want-to-go list is a first-class planning tool**: when building a future trip, the itinerary builder should surface your want-to-go places (filtered to the destination's city/country) so a dream plan can be assembled largely from places you've already collected — closing the loop from *friend shares a place → you save it → it lands in your next itinerary*.

---

## 2. The product today (feature inventory)

### Feed (`/`)
- Two tabs: **Friends** (places shared by people you follow) and **Everyone** (all shared places).
- Posts carry place, city, rating, tip, category tags, photos/videos, and date visited.
- Like, save (goes to Profile → Places), inline comments (local until a comments table ships), native share sheet with clipboard fallback.
- Stories row (follows) navigating to profiles; compact **+ Add place** button opens the add-place modal.

### Add a place (modal, used by Feed and Trips)
- **Google Places autocomplete** (Places API *New*, `AutocompleteSuggestion`) with a styled dropdown; graceful degradation to manual entry with an explanatory hint when the API key lacks access.
- Structured **city + country extraction** from Places `addressComponents` (or best-effort parsing of manual text like "Lisbon, Portugal" / "San Francisco, CA") so profile Countries/Cities lists stay complete.
- **Date visited** (manual date; GPS timestamps come with mobile auto-detection).
- **Photo & video upload** with previews (Supabase Storage `media` bucket when connected; session object-URLs in demo mode).
- Categories: Food & Drink, Nature, Culture, Shopping, Nightlife, Wellness, **Lodging, Logistics, Landmarks**.

### Trips (`/trips`)
- Create a trip: title, **start/end dates**, cover picker.
- Day-by-day itinerary builder: add days **with custom descriptions** (editable after the fact), add stops via the add-place modal, reorder or remove stops from each stop's ⋯ menu.
- Day/stop counts computed from the itinerary; date range shown on cards and headers.
- Share panel: copy a share link, native share sheet, **map view** of all stops (auto-fit bounds), list view, print-to-PDF.

### Place detail card (shared everywhere)
Clicking any place — an Explore card, a feed post, a stop on your own trip, or a stop/place on a friend's profile — opens the same **place detail card** (`src/components/PlaceDetailModal.js`): place info (category, rating, tip), photos posted by travelers, **which friends have been** (scanned across feed posts and trip itineraries via `src/services/community.js`, with attribution like *on "Kyoto · Apr 2024"* and tappable through to their profile), plus two actions: **Save to Want to go** and **Add to a trip** (picker of your trips with live/planned/past labels; adds to the last day, or creates "Day 1 — Ideas" on an empty plan).

### Explore (`/explore`)
- Live search over a curated place list; category filter chips; list and map pins share one data source.
- Google Map (dark/light theme–aware) with emoji pins; clicking a card pans/zooms to the place.
- Saves flow into Profile → Places.

### Profile (`/profile`)
- Left pane: avatar, stats (Countries / Places / Trips / Following — clickable), condensed achievements with real earned-state + progress, condensed travel-style bars.
- Right pane: **Trips / Places / Countries / Cities tabs**, each with search; Places adds category chips and per-item removal of saves.
- Places aggregates trip stops + feed saves + explore saves + places you added.

### People & public profiles (`/people`, `/user/:username`)
- Search travelers, follow/unfollow everywhere (rows, discover cards, profile headers).
- Public profiles use the **same interactive tabbed layout as your own profile** (trips expand into full itineraries; countries/cities/places all searchable).
- **Privacy levels** (set in Settings):
  - **Public** — anyone can view everything.
  - **Semi-private** — stats always visible; trips/places/countries/cities require the viewer to follow them.
  - **Private** — content requires a **mutual follow** (both directions).

### Settings (`/settings`)
- Account fields (display name, username, bio; email read-only).
- **Theme**: Dark / Bright (CSS-variable theming, persisted, map follows theme).
- Privacy level picker (public / semi-private / private).
- Notification toggles (local until backend columns ship); sign out.

### Auth & onboarding
- Google OAuth + email/password via Supabase Auth when connected; dev stubs otherwise (any email signs in as the seed user).
- 3-step onboarding: name/username → travel style → follow first friends; writes profile + follow rows.

---

## 3. Architecture

**Stack:** Create React App (React 18), React Router v7, plain CSS design system (custom properties, dark + bright themes), Google Maps JS API (modern `importLibrary` loader), Supabase (Postgres + Auth + Storage).

**Key principle — swappable data layer:** every page loads data through async functions in `src/services/` (`users`, `follows`, `posts`, `trips`, `saves`, `media`, `auth`). When `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` are set, services run real Supabase queries; otherwise they fall back to in-memory seed data (`src/data.js`) that persists mutations for the session. The UI is identical in both modes.

```
src/
├── components/       AddPlaceModal, Map (theme-aware Google Map), Avatar, Stars, Toast
├── context/          AuthContext, ThemeContext, ToastContext
├── layouts/          AppLayout (sidebar nav), AuthLayout
├── lib/              googleMaps (importLibrary loader), places (city/country extraction),
│                     collections (trips→places→countries/cities rollups), share, supabase
├── pages/            Feed, Explore, Trips, Profile, People, PublicProfile, Settings,
│                     Login, Onboarding
├── services/         async data layer (Supabase ↔ seed fallback)
└── data.js           seed data + config (CATEGORIES, BADGES)
```

**External services**
- **Google Maps JS API** — map rendering (`colorScheme` follows app theme) and Places API (New) autocomplete. Requires `REACT_APP_GOOGLE_MAPS_API_KEY` with *Maps JavaScript API* and *Places API (New)* enabled.
- **Supabase** — Postgres (schema + seed in `supabase/`), Auth (Google OAuth + email), Storage (public `media` bucket for place photos/videos).

---

## 4. Data model (Postgres via Supabase)

| Table | Purpose | Notable columns |
|---|---|---|
| `users` | profiles | `username` (unique), `privacy` (`public`/`semi`/`private`), `travel_style` jsonb, `avatar_color` |
| `places` | shared places (feed posts) | `category`, `lat`/`lng`, `google_place_id`, `city`, `country`, `country_flag`, `visited_on`, `media` jsonb, `rating`, `tip` |
| `trips` | itineraries | `title`, `start_date`, `end_date`, `itinerary` jsonb (days → stops), `share_token`, computed `days`/`stops` |
| `follows` | social graph | `(follower_id, following_id)` PK |
| `likes` / `saves` | reactions | `(user_id, place_id)` PK |
| Storage: `media` | place photos/videos | public bucket, per-user folders |

- Row-level security: public reads, authenticated owner writes; `ON UPDATE CASCADE` on user FKs enables "claiming" the seed account.
- Trip stops live in `itinerary` jsonb today; normalizing into a `trip_stops` table with `arrived_at`/`departed_at` timestamps is planned for GPS auto-detection.

**Planning-feature columns** (shipped):
- `trips.status` (`past`|`planned` stored intent for dateless trips — display status derives from dates, see `src/lib/tripStatus.js`) and `trips.destination` (powers want-to-go suggestions).
- `saves.list` — `been` | `want_to_go`; one saves table backs both lists. Places saved from friends' itineraries are session-local until trip stops normalize into referenceable rows.

---

## 5. Running it

```bash
npm install
npm start          # http://localhost:3000 — runs on seed data, no keys needed
npm run build      # production build
```

**Optional keys** (`.env.local`):
```
REACT_APP_GOOGLE_MAPS_API_KEY=...   # map + place autocomplete
REACT_APP_SUPABASE_URL=...          # real database
REACT_APP_SUPABASE_ANON_KEY=...
```
To activate the backend: create a free Supabase project, run `supabase/schema.sql` then `supabase/seed.sql` in its SQL editor, add the two env vars, restart. Details (including logging in as the seeded user): `docs/backend-setup.md`.

---

## 6. Roadmap

1. ✅ Frontend product loop (trips, places, sharing UX, profiles, privacy, themes) — done on the swappable data layer.
2. ✅ Backend wiring (schema, seed, services, auth, storage) — done; awaiting a Supabase project + keys.
3. ✅ **Planning features** — shipped:
   - **Been / Want-to-go save lists** — saves you make from others default to *Want to go*; places you log yourself are *Been*; one-tap flip on any row (Profile → Places has All / Been / Want-to-go filters). Wishlist places never inflate Countries/Cities stats or badges.
   - **Dream travel plans** — the New Trip modal offers *Trip log* vs *Dream plan* (destination + optional dates). Trip status is **derived from dates** (past / traveling now / planned) — never a manual picker; the trips list groups into *Traveling now / Dream plans / Past trips* with status chips. Dream plans surface **want-to-go suggestions matching the destination** for one-tap adding, and "Set dates" firms a plan into a dated trip in place. Friends' itinerary stops have a *Want to go* save button, closing the share → save → plan loop.
4. **Next — social & sharing:** persisted comments + notifications; public unauthenticated share route (`/trip/:shareToken`); trending computed from real saves; story viewer.
5. **Mobile app (React Native/Expo)** with automatic visit detection — geofencing + platform visit APIs (iOS `CLVisit`, Android Activity Recognition) resolving coordinates through Google Places; the Supabase backend is the sync point between web and mobile. Stops gain `arrived_at`/`departed_at` from GPS timestamps (the manual "date visited" field is the precursor). Live trips make dream plans travelable: the plan becomes the active trip and detection fills in what you actually did.

---

## 7. Design language

Dark-first, editorial feel: Playfair Display for display type, DM Sans for body; coral (`#E8A87C`), teal (`#6BBFA0`), purple (`#B8A9E0`) accents on near-black surfaces, with a warm paper-toned bright theme. Motion is subtle and consistent: fade-up entrances, card lifts, press-scale on all controls, animated modals/menus. All colors flow through CSS variables so both themes stay correct.
