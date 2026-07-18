import { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import * as authService from '../services/auth';
import { fetchProfile, createProfile, updateUserProfile } from '../services/users';
import { followUser } from '../services/follows';
import { USERS, CATEGORIES } from '../data';

const AuthContext = createContext(null);

// DEV STUB (used only when Supabase env vars are absent): simulates a
// returning user's profile as if fetched from the users table.
const seedUser = USERS.find(u => u.id === '1');
const DEV_EXISTING_PROFILE = {
  name: seedUser.name,
  username: seedUser.username,
  bio: seedUser.bio,
  privacy: seedUser.privacy ?? 'public',
  travelStyle: seedUser.travelStyle,
  following: ['2', '3', '4'], // user IDs — mirrors rows in the `follows` table
};

// Onboarding collects category ids; the users table stores [{label, pct, color}].
function travelStyleFromCategoryIds(ids) {
  const pct = Math.round(100 / Math.max(ids.length, 1));
  return ids
    .map(id => CATEGORIES.find(c => c.id === id))
    .filter(Boolean)
    .map(c => ({ label: c.label, pct, color: c.color }));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // Only the real-auth path has an async session restore to wait for.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    const applySession = async (session) => {
      if (cancelled) return;
      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser({ id: session.user.id, email: session.user.email });
      try {
        const prof = await fetchProfile(session.user.id);
        if (!cancelled) setProfile(prof); // null → onboarding
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    authService.getSession().then(applySession);
    const unsubscribe = authService.onAuthStateChange(applySession);
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // New user: Google OAuth → no profile row found → onboarding
  const signUpWithGoogle = async () => {
    if (isSupabaseConfigured) {
      await authService.signInWithGoogle(); // redirects; session handled on return
      return;
    }
    setUser({ id: Date.now().toString(), email: 'newuser@gmail.com' });
  };

  // Existing user: Google OAuth → profile row found → feed
  const signInWithGoogle = async () => {
    if (isSupabaseConfigured) {
      await authService.signInWithGoogle();
      return;
    }
    setUser({ id: '1', email: 'user@gmail.com' });
    setProfile(DEV_EXISTING_PROFILE);
  };

  const signInWithEmail = async (email, password) => {
    if (isSupabaseConfigured) {
      const { session } = (await authService.signInWithPassword(email, password)) ?? {};
      // Set state before returning so the post-login navigate doesn't race
      // the onAuthStateChange callback.
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setProfile(await fetchProfile(session.user.id));
      }
      return;
    }
    setUser({ id: '1', email });
    setProfile(DEV_EXISTING_PROFILE);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const completeOnboarding = async (profileData) => {
    if (isSupabaseConfigured && user) {
      const prof = await createProfile(user.id, {
        name: profileData.name,
        username: profileData.username,
        travelStyle: travelStyleFromCategoryIds(profileData.travelStyle),
      });
      await Promise.all(
        profileData.following.map(id => followUser(user.id, id).catch(() => {}))
      );
      setProfile(prof);
      return;
    }
    setProfile(profileData);
  };

  // Account settings: persist when Supabase is live, merge locally either way.
  const updateProfile = async (patch) => {
    if (isSupabaseConfigured && user) {
      const updated = await updateUserProfile(user.id, {
        name: patch.name ?? profile?.name,
        username: patch.username ?? profile?.username,
        bio: patch.bio ?? profile?.bio,
        privacy: patch.privacy ?? profile?.privacy ?? 'public',
      });
      setProfile(updated);
      return;
    }
    setProfile(p => ({ ...p, ...patch }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUpWithGoogle, signInWithGoogle, signInWithEmail, signOut, completeOnboarding, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
