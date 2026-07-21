import { supabase } from '../lib/supabase';
import { TRIPS, POSTS, USERS } from '../data';

// Who else has been to (or shared) this place, and what did they post?
// Scans feed posts and trip itineraries by place name (case-insensitive).
// Powers the shared place-detail card. Returns:
//   { visitors: [{ user: {id,name,username,initials,color}, via, rating, tip, media, city }],
//     media:    [{ url, type }] }   // union of everyone's photos/videos

const norm = (s) => (s ?? '').trim().toLowerCase();

function scan({ placeName, posts, trips, usersById, excludeUserId }) {
  const target = norm(placeName);
  const visitors = new Map(); // user id → visitor entry (first hit wins per user)
  const media = [];
  const seenMedia = new Set();

  const addMedia = (list) => (list ?? []).forEach(m => {
    if (m?.url && !seenMedia.has(m.url)) {
      seenMedia.add(m.url);
      media.push(m);
    }
  });

  const addVisitor = (userId, entry) => {
    if (!userId || userId === excludeUserId) return;
    const user = usersById.get(userId);
    if (!user) return;
    if (!visitors.has(userId)) visitors.set(userId, { user, ...entry });
    addMedia(entry.media);
  };

  posts.forEach(p => {
    if (norm(p.name ?? p.place) !== target) return;
    addVisitor(p.user_id, {
      via: 'post',
      rating: p.rating ?? null,
      tip: p.tip ?? '',
      media: p.media ?? [],
      city: p.city ?? '',
    });
  });

  trips.forEach(t => {
    (t.itinerary ?? []).forEach(day => (day.stops ?? []).forEach(stop => {
      if (norm(stop.name) !== target) return;
      addVisitor(t.user_id, {
        via: 'trip',
        tripTitle: t.title,
        rating: stop.rating ?? null,
        tip: stop.tip ?? '',
        media: stop.media ?? [],
        city: stop.city ?? '',
      });
    }));
  });

  return { visitors: [...visitors.values()], media };
}

export async function fetchPlaceCommunity(placeName, { excludeUserId } = {}) {
  if (!supabase) {
    const usersById = new Map(USERS.map(u => [u.id, {
      id: u.id, name: u.name, username: u.username, initials: u.initials, color: u.color,
    }]));
    return scan({
      placeName,
      posts: POSTS.map(p => ({ ...p, name: p.place })),
      trips: TRIPS,
      usersById,
      excludeUserId,
    });
  }

  const [placesRes, tripsRes] = await Promise.all([
    supabase.from('places').select('*, user:users(id, name, username, avatar_color)').ilike('name', placeName.trim()),
    supabase.from('trips').select('user_id, title, itinerary, user:users(id, name, username, avatar_color)'),
  ]);
  if (placesRes.error) throw placesRes.error;
  if (tripsRes.error) throw tripsRes.error;

  const usersById = new Map();
  const remember = (u) => {
    if (u && !usersById.has(u.id)) {
      usersById.set(u.id, {
        id: u.id, name: u.name, username: u.username,
        initials: (u.name ?? '?').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        color: u.avatar_color ?? '#E8A87C',
      });
    }
  };
  placesRes.data.forEach(p => remember(p.user));
  tripsRes.data.forEach(t => remember(t.user));

  return scan({
    placeName,
    posts: placesRes.data,
    trips: tripsRes.data,
    usersById,
    excludeUserId,
  });
}
