import { supabase } from '../lib/supabase';
import { TRIPS } from '../data';

// Maps a `trips` row to the TRIPS shape in data.js.
function mapTrip(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    status: row.status ?? 'past',
    destination: row.destination ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    coverEmoji: row.cover_emoji,
    coverBg: row.cover_bg,
    days: row.days,
    stops: row.stops,
    sharedWith: row.shared_with,
    itinerary: row.itinerary ?? [],
    shareToken: row.share_token,
  };
}

export async function fetchTrips(userId) {
  if (!supabase) return TRIPS.filter(t => t.user_id === userId).map(t => ({ ...t }));
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapTrip);
}

export async function createTrip(userId, { title, coverEmoji, coverBg, startDate, endDate, status = 'past', destination = '' }) {
  if (!supabase) {
    const trip = {
      id: Date.now(), user_id: userId, title, status, destination,
      startDate: startDate || null, endDate: endDate || null,
      coverEmoji, coverBg, days: 0, stops: 0, sharedWith: 0, itinerary: [],
    };
    TRIPS.unshift(trip); // fallback: persist for the session
    return { ...trip };
  }
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId, title, status, destination: destination || null,
      cover_emoji: coverEmoji, cover_bg: coverBg,
      start_date: startDate || null, end_date: endDate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTrip(data);
}

// Dream plans "firm up" by getting dates — status display derives from them.
export async function updateTripDates(tripId, { startDate, endDate }) {
  if (!supabase) {
    const t = TRIPS.find(t => t.id === tripId);
    if (t) Object.assign(t, { startDate: startDate || null, endDate: endDate || null });
    return;
  }
  const { error } = await supabase
    .from('trips')
    .update({ start_date: startDate || null, end_date: endDate || null })
    .eq('id', tripId);
  if (error) throw error;
}

// Replaces the trip's itinerary jsonb (used for add/edit/remove stop).
export async function updateItinerary(tripId, itinerary) {
  const days = itinerary.length;
  const stops = itinerary.reduce((n, d) => n + d.stops.length, 0);
  if (!supabase) {
    const t = TRIPS.find(t => t.id === tripId);
    if (t) Object.assign(t, { itinerary, days, stops });
    return;
  }
  const { error } = await supabase.from('trips').update({ itinerary, days, stops }).eq('id', tripId);
  if (error) throw error;
}

export async function deleteTrip(tripId) {
  if (!supabase) {
    const i = TRIPS.findIndex(t => t.id === tripId);
    if (i !== -1) TRIPS.splice(i, 1);
    return;
  }
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw error;
}
