import { supabase } from '../lib/supabase';
import { POSTS, EXPLORE_PLACES } from '../data';
import { setSaved, deletePost } from './posts';

// ── Save lists: 'been' vs 'want_to_go' ───────────────────────────────────────
// Defaults follow the mental model (no picker needed):
//   places you log yourself → been · places saved from others → want_to_go
// One tap on the list tag flips a row. Overrides live in Supabase for feed
// saves (saves.list); session-local for explore/external rows and own posts.
const LIST_OVERRIDES = new Map(); // row.key → 'been' | 'want_to_go'

// Explore saves are session-local in both modes for now — the Explore list is
// demo data with no `places` rows to reference from the `saves` table yet.
const EXPLORE_SAVES = new Set();

// Places saved from other people's itineraries (session-local in both modes —
// friends' trip stops aren't standalone `places` rows the saves table can
// reference; they get real rows when trip stops normalize into trip_stops).
const EXTERNAL_SAVES = [];
let externalSeq = 0;

export function saveExternalPlace(stop) {
  const exists = EXTERNAL_SAVES.some(s => s.name === stop.name && s.city === stop.city);
  if (exists) return false;
  EXTERNAL_SAVES.push({
    key: `ext-${++externalSeq}`,
    kind: 'external',
    placeId: null,
    name: stop.name,
    city: stop.city ?? '',
    country: stop.country ?? '',
    countryFlag: stop.countryFlag ?? '',
    category: stop.category ?? 'food',
    emoji: stop.emoji ?? '📍',
    bg: null,
    rating: null,
    media: [],
    lat: stop.lat ?? null,
    lng: stop.lng ?? null,
    tip: stop.tip ?? '',
    source: 'saved',
    list: 'want_to_go',
  });
  return true;
}

export function isExternalSaved(stop) {
  return EXTERNAL_SAVES.some(s => s.name === stop.name && s.city === stop.city);
}

export function isExploreSaved(placeId) {
  return EXPLORE_SAVES.has(placeId);
}

export function setExploreSaved(placeId, saved) {
  if (saved) EXPLORE_SAVES.add(placeId);
  else EXPLORE_SAVES.delete(placeId);
}

// Splits "San Francisco, CA" → "San Francisco"; leaves "Tokyo" alone.
const cityOnly = (city) => (city ?? '').split(',')[0].trim();

// Applies the default list (added → been, saved → want_to_go) plus overrides.
const withList = (row, dbList) => ({
  ...row,
  list: LIST_OVERRIDES.get(row.key) ?? dbList ?? (row.source === 'added' ? 'been' : 'want_to_go'),
});

// Every place connected to the user outside of trips: feed saves, explore
// saves, external saves from friends' itineraries, and places they posted
// themselves. Normalized for display, each tagged list: 'been'|'want_to_go'.
export async function fetchSavedPlaces(userId) {
  const explore = EXPLORE_PLACES.filter(p => EXPLORE_SAVES.has(p.id)).map(p => withList({
    key: `explore-${p.id}`,
    kind: 'explore',
    placeId: p.id,
    name: p.name,
    city: 'San Francisco',
    country: 'United States',
    countryFlag: '🇺🇸',
    category: p.category,
    emoji: p.emoji,
    bg: p.bg,
    rating: null,
    source: 'saved',
  }));
  const external = EXTERNAL_SAVES.map(s => withList(s));

  if (!supabase) {
    const feed = POSTS.filter(p => p.saved || p.user_id === userId).map(p => withList({
      key: `post-${p.id}`,
      kind: 'post',
      placeId: p.id,
      name: p.place,
      city: p.cityName || cityOnly(p.city),
      country: p.country || 'United States',
      countryFlag: p.countryFlag || (p.country ? '' : '🇺🇸'),
      media: p.media ?? [],
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      tip: p.tip ?? '',
      category: p.category,
      emoji: p.emoji,
      bg: p.bg,
      rating: p.rating,
      source: p.user_id === userId ? 'added' : 'saved',
    }));
    return [...feed, ...explore, ...external];
  }

  const [savedRes, mineRes] = await Promise.all([
    supabase.from('saves').select('list, place:places(*)').eq('user_id', userId),
    supabase.from('places').select('*').eq('user_id', userId),
  ]);
  if (savedRes.error) throw savedRes.error;
  if (mineRes.error) throw mineRes.error;

  const seen = new Set();
  const rows = [];
  const push = (row, source, dbList) => {
    if (!row || seen.has(row.id)) return;
    seen.add(row.id);
    rows.push(withList({
      key: `post-${row.id}`,
      kind: 'post',
      placeId: row.id,
      name: row.name,
      city: row.city_name || cityOnly(row.city),
      country: row.country ?? '',
      countryFlag: row.country_flag ?? '',
      media: row.media ?? [],
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      tip: row.tip ?? '',
      category: row.category,
      emoji: row.emoji,
      bg: row.bg,
      rating: row.rating,
      source,
    }, dbList));
  };
  mineRes.data.forEach(m => push(m, 'added'));
  savedRes.data.forEach(r => push(r.place, 'saved', r.list));
  return [...rows, ...explore, ...external];
}

// Flip a row between 'been' and 'want_to_go'.
export async function setSavedList(userId, row, list) {
  LIST_OVERRIDES.set(row.key, list);
  if (supabase && row.kind === 'post' && row.source === 'saved') {
    const { error } = await supabase
      .from('saves')
      .update({ list })
      .eq('user_id', userId)
      .eq('place_id', row.placeId);
    if (error) throw error;
  }
}

// The wishlist, optionally narrowed to a trip destination ("Lisbon", "Japan").
// Matching is fuzzy on purpose: destination ⊆ city/country or vice versa.
export async function fetchWantToGo(userId, destination = '') {
  const all = await fetchSavedPlaces(userId);
  const want = all.filter(p => p.list === 'want_to_go');
  const d = destination.trim().toLowerCase();
  if (!d) return want;
  const overlaps = (field) => {
    const f = (field ?? '').toLowerCase();
    return f && (f.includes(d) || d.includes(f));
  };
  return want.filter(p => overlaps(p.city) || overlaps(p.country));
}

// Remove a row returned by fetchSavedPlaces (Profile → Places ✕ button).
// 'saved' feed posts → unsave; 'added' posts → delete the place; explore → unsave.
export async function removeSavedPlace(userId, row) {
  LIST_OVERRIDES.delete(row.key);
  if (row.kind === 'external') {
    const i = EXTERNAL_SAVES.findIndex(s => s.key === row.key);
    if (i !== -1) EXTERNAL_SAVES.splice(i, 1);
    return;
  }
  if (row.kind === 'explore') {
    setExploreSaved(row.placeId, false);
    return;
  }
  if (row.source === 'added') {
    await deletePost(userId, row.placeId);
    return;
  }
  await setSaved(userId, row.placeId, false);
}
