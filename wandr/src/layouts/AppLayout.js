import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NAV = [
  { path: '/',       emoji: '🏠', label: 'Feed' },
  { path: '/explore', emoji: '🗺', label: 'Explore' },
  { path: '/trips',  emoji: '📋', label: 'My Trips' },
  { path: '/people', emoji: '👥', label: 'People' },
  { path: '/profile', emoji: '👤', label: 'Profile' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();

  const initials = profile?.name
    ? profile.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'YO';

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out — see you on the road ✈');
    navigate('/login');
  };

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo">W</div>
        {NAV.map(n => (
          <button
            key={n.path}
            className={`nav-btn${location.pathname === n.path ? ' active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            <span>{n.emoji}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="nav-btn" style={{ background: '#E8A87C33', color: '#E8A87C' }} onClick={() => navigate('/profile')}>
          <span>{initials}</span>
          <span className="nav-label">Profile</span>
        </button>
        <button
          className={`nav-btn${location.pathname === '/settings' ? ' active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <span>⚙</span>
          <span className="nav-label">Settings</span>
        </button>
        <button className="nav-btn signout" onClick={handleSignOut}>
          <span>⎋</span>
          <span className="nav-label">Sign out</span>
        </button>
      </nav>
      <main className="main">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
