// import { supabase } from '../lib/supabase';

export async function fetchTrips(userId) {
  // return supabase
  //   .from('trips')
  //   .select('*, trip_stops(*)')
  //   .eq('user_id', userId)
  //   .order('created_at', { ascending: false });
}

export async function createTrip(data) {
  // return supabase.from('trips').insert(data);
}

export async function addStop(tripId, stopData) {
  // return supabase.from('trip_stops').insert({ trip_id: tripId, ...stopData });
}
