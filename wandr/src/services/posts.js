// import { supabase } from '../lib/supabase';

export async function fetchFeed(userId) {
  // return supabase
  //   .from('places')
  //   .select('*, user:users(*), likes(*)')
  //   .order('created_at', { ascending: false });
}

export async function likePost(userId, postId) {
  // return supabase.from('likes').insert({ user_id: userId, place_id: postId });
}

export async function savePost(userId, postId) {
  // return supabase.from('saves').insert({ user_id: userId, place_id: postId });
}

export async function createPost(data) {
  // return supabase.from('places').insert(data);
}
