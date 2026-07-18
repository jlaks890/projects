import { supabase } from '../lib/supabase';
import { USERS, FOLLOWS } from '../data';
import { mapUser } from './users';

// Users that `userId` follows.
export async function fetchFollowing(userId) {
  if (!supabase) {
    return FOLLOWS
      .filter(f => f.follower_id === userId)
      .map(f => USERS.find(u => u.id === f.following_id))
      .filter(Boolean);
  }
  const { data, error } = await supabase
    .from('follows')
    .select('following:users!follows_following_id_fkey(*)')
    .eq('follower_id', userId);
  if (error) throw error;
  return data.map(r => mapUser(r.following));
}

export async function fetchFollowerCount(userId) {
  if (!supabase) return FOLLOWS.filter(f => f.following_id === userId).length;
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function followUser(followerId, followingId) {
  if (!supabase) {
    // fallback: mutate the in-memory seed so state survives navigation
    if (!FOLLOWS.some(f => f.follower_id === followerId && f.following_id === followingId)) {
      FOLLOWS.push({ follower_id: followerId, following_id: followingId });
    }
    return;
  }
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId, followingId) {
  if (!supabase) {
    const i = FOLLOWS.findIndex(f => f.follower_id === followerId && f.following_id === followingId);
    if (i !== -1) FOLLOWS.splice(i, 1);
    return;
  }
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}
