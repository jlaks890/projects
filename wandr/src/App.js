import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

import FeedPage from './pages/Feed';
import ExplorePage from './pages/Explore';
import TripsPage from './pages/Trips';
import ProfilePage from './pages/Profile';
import PeoplePage from './pages/People';
import PublicProfilePage from './pages/PublicProfile';
import LoginPage from './pages/Login';
import OnboardingPage from './pages/Onboarding';
import SettingsPage from './pages/Settings';

// Requires auth + complete profile
function PrivateRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null; // restoring Supabase session
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;
  return children;
}

// Requires auth but no profile yet (onboarding)
function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes (no sidebar) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={
          <OnboardingRoute><OnboardingPage /></OnboardingRoute>
        } />
      </Route>

      {/* App routes (with sidebar) */}
      <Route element={
        <PrivateRoute><AppLayout /></PrivateRoute>
      }>
        <Route path="/" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/user/:username" element={<PublicProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
