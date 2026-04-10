import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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
  const { profile } = useAuth();

  const initials = profile?.name
    ? profile.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'YO';

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
      </nav>
      <main className="main">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
