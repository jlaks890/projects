import { createContext, useContext, useState } from 'react';
import { USERS } from '../data';

const AuthContext = createContext(null);

// DEV STUB: simulates a returning user's profile fetched from Supabase.
// When connected, replace with: supabase.from('users').select().eq('id', user.id).single()
const seedUser = USERS.find(u => u.id === '1');
const DEV_EXISTING_PROFILE = {
  name: seedUser.name,
  username: seedUser.username,
  travelStyle: seedUser.travelStyle.map(s => s.label.toLowerCase().split(' ')[0]),
  following: ['2', '3', '4'], // user IDs — mirrors rows in the `follows` table
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // New user: Google OAuth → no profile row found → onboarding
  // TODO: supabase.auth.signInWithOAuth({ provider: 'google' })
  //       then query users table by id — if no row, leave profile null
  const signUpWithGoogle = async () => {
    setUser({ id: Date.now().toString(), email: 'newuser@gmail.com' });
  };

  // Existing user: Google OAuth → profile row found → feed
  // TODO: supabase.auth.signInWithOAuth({ provider: 'google' })
  //       then query users table by id → setProfile(row)
  const signInWithGoogle = async () => {
    setUser({ id: '1', email: 'user@gmail.com' });
    setProfile(DEV_EXISTING_PROFILE); // DEV STUB — replace with Supabase fetch
  };

  // Existing user: email + password → profile row found → feed
  // TODO: supabase.auth.signInWithPassword({ email, password })
  //       then query users table by id → setProfile(row)
  const signInWithEmail = async (email, password) => { // eslint-disable-line no-unused-vars
    setUser({ id: '1', email });
    setProfile(DEV_EXISTING_PROFILE); // DEV STUB — replace with Supabase fetch
  };

  const signOut = async () => {
    // TODO: supabase.auth.signOut()
    setUser(null);
    setProfile(null);
  };

  const completeOnboarding = (profileData) => {
    // TODO: insert row into Supabase `users` table, then set local state
    setProfile(profileData);
  };

  return (
    <AuthContext.Provider value={{ user, profile, signUpWithGoogle, signInWithGoogle, signInWithEmail, signOut, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
