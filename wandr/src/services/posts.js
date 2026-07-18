import { supabase } from '../lib/supabase';
import { POSTS } from '../data';

function timeAgo(iso) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Maps a `places` row (with joined likes/saves arrays) to the POSTS shape.
// `likes` excludes the current user's own like — the UI renders
// `likes + (liked ? 1 : 0)`, matching how the static seed data works.
function mapPost(row, currentUserId) {
  const liked = Boolean(row.likes?.some(l => l.user_id === currentUserId));
  return {
    id: row.id,
    user_id: row.user_id,
    place: row.name,
    city: row.city,
    category: row.category,
    emoji: row.emoji,
    bg: row.bg,
    tip: row.tip,
    rating: row.rating,
    likes: (row.likes?.length ?? 0) - (liked ? 1 : 0),
    liked,
    comments: 0, // no comments table yet — see docs/frontend-flows.md
    timeAgo: timeAgo(row.created_at),
    lat: row.lat,
    lng: row.lng,
    tags: row.tags ?? [],
    saved: Boolean(row.saves?.some(s => s.user_id === currentUserId)),
    cityName: row.city_name ?? row.cityName ?? '',
    country: row.country ?? '',
    countryFlag: row.country_flag ?? row.countryFlag ?? '',
    visited: row.visited_on ?? row.visited ?? '',
    media: row.media ?? [],
  };
}

export async function fetchFeed(currentUserId) {
  if (!supabase) return POSTS.map(p => ({ ...p }));
  const { data, error } = await supabase
    .from('places')
    .select('*, likes(user_id), saves(user_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => mapPost(row, currentUserId));
}

export async function createPost(userId, form) {
  const row = {
    user_id: userId,
    name: form.name,
    city: form.city,
    category: form.category || 'food',
    emoji: form.emoji,
    bg: form.bg ?? '#1a1100',
    lat: form.lat,
    lng: form.lng,
    tip: form.tip || 'Check this place out!',
    rating: form.rating,
    tags: [form.category || 'food'],
    city_name: form.cityName || '',
    country: form.country || '',
    country_flag: form.countryFlag || '',
    visited_on: form.visited || null,
    media: form.media ?? [],
  };
  if (!supabase) {
    const post = mapPost({ ...row, id: Date.now(), created_at: new Date().toISOString(), likes: [], saves: [] }, userId);
    POSTS.unshift(post); // fallback: persist for the session
    return { ...post };
  }
  const { data, error } = await supabase.from('places').insert(row).select().single();
  if (error) throw error;
  return mapPost({ ...data, likes: [], saves: [] }, userId);
}

// A user's own shared places (public profile Places/Countries/Cities tabs).
export async function fetchUserPlaces(userId) {
  if (!supabase) {
    return POSTS.filter(p => p.user_id === userId).map(p => ({
      key: `post-${p.id}`,
      name: p.place,
      city: p.cityName || (p.city ?? '').split(',')[0].trim(),
      country: p.country ?? '',
      countryFlag: p.countryFlag ?? '',
      category: p.category,
      emoji: p.emoji,
      bg: p.bg,
      rating: p.rating,
      media: p.media ?? [],
      source: 'added',
    }));
  }
  const { data, error } = await supabase.from('places').select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(row => ({
    key: `post-${row.id}`,
    name: row.name,
    city: row.city_name || (row.city ?? '').split(',')[0].trim(),
    country: row.country ?? '',
    countryFlag: row.country_flag ?? '',
    category: row.category,
    emoji: row.emoji,
    bg: row.bg,
    rating: row.rating,
    media: row.media ?? [],
    source: 'added',
  }));
}

// Remove a place the user posted themselves (also removes it from the feed).
export async function deletePost(userId, placeId) {
  if (!supabase) {
    const i = POSTS.findIndex(p => p.id === placeId);
    if (i !== -1) POSTS.splice(i, 1);
    return;
  }
  const { error } = await supabase.from('places').delete().eq('id', placeId).eq('user_id', userId);
  if (error) throw error;
}

export async function setLiked(userId, placeId, liked) {
  if (!supabase) {
    const p = POSTS.find(p => p.id === placeId);
    if (p) p.liked = liked;
    return;
  }
  const { error } = liked
    ? await supabase.from('likes').insert({ user_id: userId, place_id: placeId })
    : await supabase.from('likes').delete().eq('user_id', userId).eq('place_id', placeId);
  if (error) throw error;
}

export async function setSaved(userId, placeId, saved) {
  if (!supabase) {
    const p = POSTS.find(p => p.id === placeId);
    if (p) p.saved = saved;
    return;
  }
  const { error } = saved
    ? await supabase.from('saves').insert({ user_id: userId, place_id: placeId })
    : await supabase.from('saves').delete().eq('user_id', userId).eq('place_id', placeId);
  if (error) throw error;
}
