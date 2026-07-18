import { supabase } from '../lib/supabase';

// Uploads a photo/video attached to a place.
// - Supabase mode: stored in the public `media` storage bucket (see
//   supabase/schema.sql for the bucket + policies).
// - Fallback mode: an object URL that lives for the browser session.
// Returns { url, type: 'image' | 'video' }.
export async function uploadMedia(userId, file) {
  const type = file.type.startsWith('video') ? 'video' : 'image';
  if (!supabase) {
    return { url: URL.createObjectURL(file), type };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, type };
}
