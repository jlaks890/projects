import { supabase } from '../lib/supabase';
import { POSTS, EXPLORE_PLACES } from '../data';
import { setSaved, deletePost } from './posts';

// Explore saves are session-local in both modes for now — the Explore list is
// demo data with no `places` rows to reference from the `saves` table yet.
const EXPLORE_SAVES = new Set();

export function isExploreSaved(placeId) {
  return EXPLORE_SAVES.has(placeId);
}

export function setExploreSaved(placeId, saved) {
  if (saved) EXPLORE_SAVES.add(placeId);
  else EXPLORE_SAVES.delete(placeId);
}

// Splits "San Francisco, CA" → "San Francisco"; leaves "Tokyo" alone.
const cityOnly = (city) => (city ?? '').split(',')[0].trim();

// Every place connected to the user outside of trips: feed saves, explore
// saves, and places they posted themselves. Normalized for display.
export async function fetchSavedPlaces(userId) {
  const explore = EXPLORE_PLACES.filter(p => EXPLORE_SAVES.has(p.id)).map(p => ({
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

  if (!supabase) {
    const feed = POSTS.filter(p => p.saved || p.user_id === userId).map(p => ({
      key: `post-${p.id}`,
      kind: 'post',
      placeId: p.id,
      name: p.place,
      city: p.cityName || cityOnly(p.city),
      country: p.country || 'United States',
      countryFlag: p.countryFlag || (p.country ? '' : '🇺🇸'),
      media: p.media ?? [],
      category: p.category,
      emoji: p.emoji,
      bg: p.bg,
      rating: p.rating,
      source: p.user_id === userId ? 'added' : 'saved',
    }));
    return [...feed, ...explore];
  }

  const [savedRes, mineRes] = await Promise.all([
    supabase.from('saves').select('place:places(*)').eq('user_id', userId),
    supabase.from('places').select('*').eq('user_id', userId),
  ]);
  if (savedRes.error) throw savedRes.error;
  if (mineRes.error) throw mineRes.error;

  const seen = new Set();
  const rows = [];
  const push = (row, source) => {
    if (!row || seen.has(row.id)) return;
    seen.add(row.id);
    rows.push({
      key: `post-${row.id}`,
      kind: 'post',
      placeId: row.id,
      name: row.name,
      city: row.city_name || cityOnly(row.city),
      country: row.country ?? '',
      countryFlag: row.country_flag ?? '',
      media: row.media ?? [],
      category: row.category,
      emoji: row.emoji,
      bg: row.bg,
      rating: row.rating,
      source,
    });
  };
  mineRes.data.forEach(m => push(m, 'added'));
  savedRes.data.forEach(r => push(r.place, 'saved'));
  return [...rows, ...explore];
}

// Remove a row returned by fetchSavedPlaces (Profile → Places ✕ button).
// 'saved' feed posts → unsave; 'added' posts → delete the place; explore → unsave.
export async function removeSavedPlace(userId, row) {
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
