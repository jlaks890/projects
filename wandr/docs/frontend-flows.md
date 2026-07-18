# Frontend Audit & Page Flows

Audit of every page: what works, what's fake/dead, and the designed target flow.
Priorities are relative to the product vision in `vision.md` (trip tracking → shareable itineraries).

> **Status update (July 2026):** most of this audit has been implemented. Now working:
> follow/unfollow (People + public profiles), new trip / add day / add stop / stop menu
> (move/remove), real share + copy-link, trip Map view (auto-fit bounds), Explore search +
> unified list/pins + save + click-to-pan, feed comments (local until a comments table
> exists), story/trending navigation, badge earned-states with progress, sidebar sign-out,
> friend itinerary expansion on public profiles, and a motion pass (press states, card
> lifts, modal/menu animations). Google Maps now uses the modern importLibrary loader with
> `colorScheme: DARK` and the new Places `AutocompleteSuggestion` API (works with
> new-style API keys that lack legacy Places access).
>
> Still open: story viewer, real comment persistence, computed trending, public
> unauthenticated share route (`/trip/:shareToken`), edit profile, Story/PDF export
> (PDF currently uses the browser print dialog).

Legend: ✅ works · 🟡 works but local-only (state resets on navigation) · ❌ dead (renders but does nothing) · 🎭 fake (hardcoded display posing as a feature)

---

## Feed (`/`)

### Current state
| Element | Status |
|---|---|
| + Add place → AddPlaceModal (Places Autocomplete) | ✅ |
| Like / Save buttons | 🟡 local state, resets on navigation |
| Comment button (`💬 n`) | ❌ no handler at all |
| Share button | 🎭 toast "Sharing…" only |
| Story row avatars | ❌ not clickable, no story viewer |
| "Trending near you" sidebar | 🎭 hardcoded inline array |
| "Friends' recent trips" → View button | ❌ no handler |
| "Suggested for you" link | ❌ styled as link, no handler |

Bug: `handleAddPlace` drops the `lat`/`lng` that AddPlaceModal captures from Places Autocomplete — new posts can never appear on a map.

### Target flow
1. Feed loads posts from backend (followed users + own), newest first.
2. Like/Save persist per-user; Save adds the place to "Saved places" (visible on Profile and Explore).
3. Comment → inline comment thread expands under the post (needs `comments` table).
4. Share → native `navigator.share` when available, else copy a link to the place/post.
5. Story avatars → click opens that user's public profile (cheap v1) — a story viewer is post-MVP.
6. "Friends' recent trips" View → navigate to that user's trip itinerary (see PublicProfile flow).
7. Trending sidebar → computed from real save counts, or removed until backend supports it.

---

## Explore (`/explore`)

### Current state
| Element | Status |
|---|---|
| Category filter chips → map pins | ✅ |
| Google Map with emoji pins + info windows | ✅ |
| Search bar | 🎭 it's a `<div>`, not an input |
| Place list | 🎭 hardcoded inline, duplicates/diverges from `MAP_PINS` |
| + Save on place cards | ❌ no handler |
| Place cards | ❌ not clickable, no detail view |

### Target flow
1. Search becomes a real input wired to Google Places Text Search (and later, places friends saved).
2. Place list and map pins render from the same data source; hovering a card highlights its pin, clicking a card pans/zooms the map.
3. Clicking a pin's info window or card opens a place detail (photos via `place_id`, friends' tips/ratings, Save button).
4. Save persists to the user's saved places.
5. Map centers on user's geolocation (`navigator.geolocation`) with SF fallback — first step toward the GPS vision.

---

## Trips (`/trips`) — core of the product vision

### Current state
| Element | Status |
|---|---|
| Trip list → select → itinerary detail | ✅ |
| + New trip | ❌ no handler — the core creation flow doesn't exist |
| Share trip button + 4 share buttons | 🎭 toasts only; "Copy link" doesn't copy |
| Export row (Map view / List / Story / PDF) | ❌ no handlers |
| ⋯ menu on each stop | ❌ no handler |
| + Add stop to day N | ❌ no handler (AddPlaceModal already exists and could be reused) |
| `days` / `stops` counts | 🎭 denormalized, don't match itinerary contents |

### Target flow
1. **+ New trip** → modal: title, destination, dates → creates trip, becomes `active` selection. (With backend: `status: 'active'` trip that new places funnel into — the "currently traveling" concept.)
2. **+ Add stop** → reuse AddPlaceModal (Places Autocomplete) with a day picker; append to itinerary.
3. **⋯ on stop** → edit note/rating, move to another day, remove.
4. **Share** → real actions: Copy link copies `wandr.app/trip/:shareToken`; the public link renders a read-only itinerary page (new unauthenticated route). Wandr-friends share creates an in-app notification/feed item. Instagram/WhatsApp are post-MVP.
5. **Export row** → Map view renders trip stops on the existing `Map` component (all data present: lat/lng); List is the current view; PDF/Story post-MVP.
6. `days`/`stops` computed from itinerary, not stored.

---

## Profile (`/profile`)

### Current state
| Element | Status |
|---|---|
| Stat tabs (Countries/Places/Trips/Following) with derived data | ✅ nicely derived from trips |
| Following list → public profiles | ✅ |
| Badges | 🎭 all show "🔒 Locked" — earned state never computed, though the data to unlock several exists |
| "joined 2024" | 🎭 hardcoded |
| Edit profile | missing entirely |
| Sign out | missing entirely — `signOut()` exists in AuthContext but no UI calls it |

### Target flow
1. Compute badge earned-state from real stats (e.g. Jet Setter = countries ≥ 10) and show progress ("7/10 countries").
2. Edit profile: name, username, bio, travel style re-pick.
3. Sign out button (in sidebar footer or profile header).
4. Trip cards in the Trips tab navigate to `/trips` with that trip selected (needs trip id in URL, e.g. `/trips/:id`).

---

## People (`/people`) & Public Profile (`/user/:username`)

### Current state
| Element | Status |
|---|---|
| Search by name/username | ✅ |
| Navigate to public profiles | ✅ |
| Follow/unfollow | ❌ doesn't exist anywhere — "Following" chip is display-only; PublicProfile has no Follow button |
| Public profile trip cards | ❌ not clickable — can't view a friend's itinerary (the whole point of sharing) |

### Target flow
1. Follow/Unfollow button on user rows and on PublicProfile header; updates feed + stories.
2. Friend's trip card → read-only itinerary view (reuse the Trips right-panel as a `<TripItinerary readOnly>` component; this is the same component the public share link renders).

---

## Login & Onboarding

### Current state
- Onboarding 3-step wizard: ✅ fully functional (validation, progress, back/next).
- Login: works as dev stub; email sign-in accepts any credentials; no email sign-up.

### Target flow
1. Swap stubs for `supabase.auth` (Google OAuth + email). New OAuth user with no profile row → onboarding; existing → feed.
2. Onboarding `completeOnboarding` writes the `users` row + `follows` rows.

---

## Cross-cutting improvements

1. **Async data layer first.** Pages import from `data.js` directly; every list above needs to come from `src/services/` so the backend swap is invisible to components. (This is the backend-connection work — see `backend-setup.md`.)
2. **Extract `TripItinerary`** from Trips page — reused by public share page and friend profiles.
3. **Trip routes**: `/trips/:id` (own, editable), `/trip/:shareToken` (public, read-only, outside auth guard).
4. **Dead dependency**: `lucide-react` is installed but never imported — remove, or adopt it to replace emoji icons.
5. **Docs drift**: CLAUDE.md says React Router v6; package.json has v7. CLAUDE.md's page list is missing People and PublicProfile.
6. **State loss**: likes/saves/new posts vanish on navigation (local page state) — solved by the backend, not worth an interim fix.

## Suggested build order (frontend)

1. Follow/unfollow + Follow button (small, unlocks the social loop)
2. New trip + Add stop + stop editing (core product loop)
3. Trip share: copy link + public read-only itinerary route
4. Explore: real search input + unified list/pins + save
5. Feed: comments, real share, story→profile links
6. Badges earned-state, edit profile, sign out
