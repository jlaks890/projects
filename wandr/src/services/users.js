import { supabase } from '../lib/supabase';
import { USERS } from '../data';

// Maps a Supabase `users` row to the shape the app uses (see USERS in data.js).
export function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio ?? '',
    color: row.avatar_color ?? '#E8A87C',
    initials: (row.name ?? '?').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    hasStory: row.has_story ?? false,
    privacy: row.privacy ?? 'public', // 'public' | 'semi' | 'private'
    travelStyle: row.travel_style ?? [],
    topPlaces: row.top_places ?? [],
  };
}

export async function fetchUsers() {
  if (!supabase) return USERS;
  const { data, error } = await supabase.from('users').select('*').order('name');
  if (error) throw error;
  return data.map(mapUser);
}

export async function fetchUserByUsername(username) {
  if (!supabase) return USERS.find(u => u.username === username) ?? null;
  const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data) : null;
}

// Profile row for the logged-in user; null means "needs onboarding".
export async function fetchProfile(userId) {
  if (!supabase) return null; // dev stub path — AuthContext supplies its own profile
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data) : null;
}

// Account settings: update the user's own profile row.
export async function updateUserProfile(userId, { name, username, bio, privacy }) {
  if (!supabase) return null; // dev stub — AuthContext merges locally
  const { data, error } = await supabase
    .from('users')
    .update({ name, username, bio, privacy })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return mapUser(data);
}

// Called at the end of onboarding: creates the user's profile row.
export async function createProfile(userId, { name, username, travelStyle }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, name, username, travel_style: travelStyle })
    .select()
    .single();
  if (error) throw error;
  return mapUser(data);
}
