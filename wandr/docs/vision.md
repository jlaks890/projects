# Wandr — Product Vision

## What Wandr is becoming

Wandr is a web + mobile app for **tracking the places you visit during a trip**. It connects to Google Maps and the device's GPS location so it can:

1. **Automatically detect places you've visited** while a trip is active (via GPS / visit detection on mobile), and
2. **Support manual entry** for places the detection misses or that you add after the fact.

Once a trip is complete — full list of places visited plus logistics — it should be **easily shareable as an itinerary to friends**.

## How this maps to the current codebase

The trip data model in `src/data.js` is already close: trips have day-by-day itineraries whose stops carry `lat`/`lng`, `address`, `city`, `country`, time-of-day, tips, and ratings. The social layer (users, follows, `sharedWith`) gives a head start on sharing, and `AddPlaceModal` is the seed of manual entry.

### Data model additions needed per stop

- `arrived_at` / `departed_at` timestamps (detection produces these naturally)
- `source: 'auto' | 'manual'`
- Google `place_id` (canonical reference; unlocks photos, categories, details from the Places API)

### Architectural implications

1. **Place detection is a mobile/native concern.** Continuous GPS tracking can't run in a background browser tab. The web app is the viewing/editing/sharing surface; detection comes from a future mobile app (React Native/Expo to reuse React code) using geofencing / platform visit-detection APIs (iOS `CLVisit`, Android Activity Recognition) plus the Google Places API to resolve coordinates to places.
2. **The backend becomes the sync point** between web and mobile — this raises the priority of the planned Supabase migration (`docs/backend-setup.md`), since trips stop being local page state.
3. **Google Maps integration** replaces the static map pins on Explore: Maps JavaScript SDK for display, Places API for search/autocomplete in manual entry.
4. **Shareable itineraries** imply public trip URLs (e.g. `/trip/:id` with a share token) outside the auth-guarded route group, plus per-trip visibility settings.
5. **Trip lifecycle** needs an "active trip" concept: start a trip → places accumulate (auto or manual) → finalize → share. Today trips are static, finished objects.

## Roadmap (rough priority order)

1. **Supabase backend** — everything depends on persistence.
2. **Google Places-powered manual entry** — autocomplete search, canonical place data.
3. **Shareable trip pages** — public itinerary URLs with visibility controls.
4. **Mobile app with automatic visit detection** — the biggest lift; last.
