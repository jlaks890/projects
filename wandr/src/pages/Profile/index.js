import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USERS, FOLLOWS, TRIPS, BADGES } from '../../data';

const STAT_TABS = [
  { id: 'countries', label: 'Countries' },
  { id: 'places',    label: 'Places saved' },
  { id: 'trips',     label: 'Trips shared' },
  { id: 'following', label: 'Following' },
];

function EmptyState({ message }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0', textAlign: 'center', lineHeight: 1.6 }}>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('countries');

  // Merge auth profile data with seed user record
  const seedUser = USERS.find(u => u.id === '1');
  const displayName = profile?.name || seedUser?.name || 'Your Profile';
  const handle = profile?.username ? `@${profile.username}` : `@${seedUser?.username}`;
  const initials = displayName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Travel style: from onboarding selection or seed user data
  const travelStyle = (profile?.travelStyle?.length && typeof profile.travelStyle[0] === 'object')
    ? profile.travelStyle
    : seedUser?.travelStyle ?? [];

  // Trips: filter by logged-in user id
  // TODO: replace with Supabase query: select * from trips where user_id = user.id
  const trips = user ? TRIPS.filter(t => t.user_id === user.id) : [];

  // Places: derived from trip stops
  const savedPlaces = trips.flatMap(t => t.itinerary.flatMap(d => d.stops));

  // Countries: aggregated from places
  const countries = Object.values(
    savedPlaces.reduce((acc, stop) => {
      if (!acc[stop.country]) {
        acc[stop.country] = { name: stop.country, flag: stop.countryFlag, cities: new Set(), count: 0 };
      }
      acc[stop.country].cities.add(stop.city);
      acc[stop.country].count += 1;
      return acc;
    }, {})
  ).map(c => ({ ...c, cities: [...c.cities].join(' · ') }));

  // Following: join FOLLOWS → USERS
  // TODO: replace with Supabase query: select users.* from follows join users on following_id = users.id where follower_id = user.id
  const following = user
    ? FOLLOWS.filter(f => f.follower_id === user.id).map(f => USERS.find(u => u.id === f.following_id)).filter(Boolean)
    : [];

  const stats = {
    countries:  countries.length,
    places:     savedPlaces.length,
    trips:      trips.length,
    following:  following.length,
  };

  const tabContent = {
    countries: countries.length ? (
      countries.map(c => (
        <div className="country-row" key={c.name}>
          <span className="country-flag">{c.flag}</span>
          <div style={{ flex: 1 }}>
            <div className="country-name">{c.name}</div>
            <div className="country-cities">{c.cities}</div>
          </div>
          <span className="country-count">{c.count} places</span>
        </div>
      ))
    ) : <EmptyState message="No countries yet — start adding places to your trips!" />,

    places: savedPlaces.length ? (
      savedPlaces.map((p, i) => (
        <div className="place-card" key={`${p.name}-${i}`} style={{ marginBottom: 10 }}>
          <div className="p-thumb" style={{ background: 'var(--bg3)' }}>{p.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="p-name">{p.name}</div>
            <div className="p-sub">{p.city}, {p.country} · {p.category}</div>
          </div>
          <span style={{ fontSize: 18 }}>{p.countryFlag}</span>
        </div>
      ))
    ) : <EmptyState message="No saved places yet — save places from your feed!" />,

    trips: trips.length ? (
      trips.map(t => (
        <div className="trip-card" key={t.id} style={{ marginBottom: 10 }}>
          <div className="trip-cover" style={{ background: t.coverBg, height: 80 }}>
            <span style={{ fontSize: 36 }}>{t.coverEmoji}</span>
          </div>
          <div className="trip-info">
            <div className="trip-title">{t.title}</div>
            <div className="trip-meta">
              <span>{t.days} days</span><span>·</span><span>{t.stops} stops</span>
            </div>
          </div>
        </div>
      ))
    ) : <EmptyState message="No trips yet — create your first trip!" />,

    following: following.length ? (
      following.map(f => (
        <div
          key={f.id}
          onClick={() => navigate(`/user/${f.username}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: f.color + '33', color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
            {f.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{f.bio}</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>→</span>
        </div>
      ))
    ) : <EmptyState message="Not following anyone yet — find friends in Explore!" />,
  };

  return (
    <div className="page active" id="page-profile">
      <div className="profile-layout">
        <div className="profile-left">
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: '#E8A87C33', color: '#E8A87C' }}>{initials}</div>
            <div className="profile-name">{displayName}</div>
            <div className="profile-handle">{handle} · joined 2024</div>
          </div>

          <div className="stat-grid">
            {STAT_TABS.map(tab => (
              <div key={tab.id} className={`stat-card${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <div className="stat-num">{stats[tab.id]}</div>
                <div className="stat-label">{tab.label}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-heading" style={{ marginBottom: 12 }}>
            {STAT_TABS.find(t => t.id === activeTab)?.label}
          </div>
          <div>{tabContent[activeTab]}</div>
        </div>

        <div className="profile-right">
          <div style={{ marginBottom: 28 }}>
            <div className="section-heading">Achievements</div>
            <div className="section-sub">Earned through your travels</div>
            <div className="badge-grid">
              {BADGES.map(b => (
                <div key={b.name} className="badge-card">
                  <div className="badge-emoji">{b.emoji}</div>
                  <div className="badge-name">{b.name}</div>
                  <div className="badge-desc">{b.desc}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>🔒 Locked</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-heading">Travel style</div>
            <div className="section-sub">Based on your interests</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {travelStyle.map(s => (
                <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: s.color, fontWeight: 600 }}>{s.pct}%</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                  <div style={{ marginTop: 8, height: 3, background: 'var(--bg4)', borderRadius: 2 }}>
                    <div style={{ width: s.pct + '%', height: '100%', background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
