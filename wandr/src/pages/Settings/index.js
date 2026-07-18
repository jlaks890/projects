import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

function Toggle({ on, onChange }) {
  return <button className={`switch${on ? ' on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />;
}

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);

  // Local-only until the backend grows matching columns
  const [prefs, setPrefs] = useState(() => JSON.parse(localStorage.getItem('wandr-prefs') ?? '{"tripAlerts":true,"friendActivity":true,"privateAccount":false}'));
  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem('wandr-prefs', JSON.stringify(next));
  };

  const dirty = name !== (profile?.name ?? '') || username !== (profile?.username ?? '') || bio !== (profile?.bio ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim() });
      showToast('✓ Profile updated');
    } catch {
      showToast('Could not save — is that username taken?');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="page active" id="page-settings">
      <div className="settings-layout">
        <div className="section-heading">Settings</div>
        <div className="section-sub">Your account, appearance, and preferences</div>

        {/* Appearance */}
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="settings-section-sub">Pick the look that's easiest on your eyes</div>
          <div className="theme-cards">
            <button className={`theme-card${theme === 'dark' ? ' selected' : ''}`} onClick={() => setTheme('dark')}>
              <div className="theme-swatch" style={{ background: '#0e0e0e', color: '#E8A87C' }}>🌙</div>
              Dark
            </button>
            <button className={`theme-card${theme === 'light' ? ' selected' : ''}`} onClick={() => setTheme('light')}>
              <div className="theme-swatch" style={{ background: '#faf7f1', color: '#C0742F' }}>☀️</div>
              Bright
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="settings-section">
          <div className="settings-section-title">Account</div>
          <div className="settings-section-sub">How you appear to other travelers</div>
          <div className="input-group">
            <div className="input-label">Display name</div>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="input-group">
            <div className="input-label">Username</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>@</span>
              <input
                className="input-field"
                style={{ paddingLeft: 28 }}
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-label">Bio</div>
            <textarea className="input-field" value={bio} onChange={e => setBio(e.target.value)} placeholder="A line about how you travel..." />
          </div>
          <div className="input-group">
            <div className="input-label">Email</div>
            <input className="input-field" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
            <div className="settings-row-sub" style={{ marginTop: 6 }}>Managed by your sign-in provider</div>
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 22px' }} disabled={!dirty || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">Notifications</div>
          <div className="settings-section-sub">What Wandr pings you about</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Trip alerts</div>
              <div className="settings-row-sub">When a friend shares an itinerary with you</div>
            </div>
            <Toggle on={prefs.tripAlerts} onChange={v => setPref('tripAlerts', v)} />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Friend activity</div>
              <div className="settings-row-sub">Likes, comments, and new followers</div>
            </div>
            <Toggle on={prefs.friendActivity} onChange={v => setPref('friendActivity', v)} />
          </div>
        </div>

        {/* Privacy */}
        <div className="settings-section">
          <div className="settings-section-title">Privacy</div>
          <div className="settings-section-sub">Who can see your trips, places, countries, and cities</div>
          <div className="theme-cards">
            {[
              { id: 'public',  emoji: '🌍', label: 'Public',       sub: 'Anyone can view' },
              { id: 'semi',    emoji: '👥', label: 'Semi-private', sub: 'Followers only' },
              { id: 'private', emoji: '🔒', label: 'Private',      sub: 'Mutual follows only' },
            ].map(opt => (
              <button
                key={opt.id}
                className={`theme-card${(profile?.privacy ?? 'public') === opt.id ? ' selected' : ''}`}
                onClick={async () => {
                  try {
                    await updateProfile({ privacy: opt.id });
                    showToast(`✓ Profile is now ${opt.label.toLowerCase()}`);
                  } catch {
                    showToast('Could not update privacy');
                  }
                }}
              >
                <div className="theme-swatch" style={{ background: 'var(--bg3)' }}>{opt.emoji}</div>
                {opt.label}
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Session */}
        <div className="settings-section">
          <div className="settings-section-title">Session</div>
          <div className="settings-section-sub">Signed in as {user?.email ?? 'you'}</div>
          <button className="btn-secondary" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
