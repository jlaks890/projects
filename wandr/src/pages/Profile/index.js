import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { USERS, BADGES, CATEGORIES } from '../../data';
import { fetchTrips } from '../../services/trips';
import { fetchFollowing } from '../../services/follows';
import { fetchSavedPlaces, removeSavedPlace } from '../../services/saves';
import { stopsToPlaces, aggregateCountries, aggregateCities } from '../../lib/collections';

const TABS = [
  { id: 'trips',     label: 'Trips',     searchHint: '🔍 Search trips by title...' },
  { id: 'places',    label: 'Places',    searchHint: '🔍 Search places by name or city...' },
  { id: 'countries', label: 'Countries', searchHint: '🔍 Search countries...' },
  { id: 'cities',    label: 'Cities',    searchHint: '🔍 Search cities...' },
];

const SOURCE_LABEL = { trip: 'Trip', saved: 'Saved', added: 'Added' };

function EmptyState({ message }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text3)', padding: '28px 0', textAlign: 'center', lineHeight: 1.6 }}>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trips');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [trips, setTrips] = useState([]);
  const [following, setFollowing] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchTrips(user.id), fetchFollowing(user.id), fetchSavedPlaces(user.id)])
      .then(([t, f, s]) => {
        if (cancelled) return;
        setTrips(t);
        setFollowing(f);
        setSavedPlaces(s);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTab = (id) => {
    setActiveTab(id);
    setQuery('');
    setCatFilter('all');
  };

  const handleRemoveSave = (e, p) => {
    e.stopPropagation();
    setSavedPlaces(list => list.filter(x => x.key !== p.key));
    removeSavedPlace(user.id, p).catch(() => {});
    showToast(p.source === 'added' ? 'Place removed' : `Removed ${p.name} from saved`);
  };

  // Merge auth profile data with seed user record
  const seedUser = USERS.find(u => u.id === '1');
  const displayName = profile?.name || seedUser?.name || 'Your Profile';
  const handle = profile?.username ? `@${profile.username}` : `@${seedUser?.username}`;
  const initials = displayName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const travelStyle = (profile?.travelStyle?.length && typeof profile.travelStyle[0] === 'object')
    ? profile.travelStyle
    : seedUser?.travelStyle ?? [];

  // ── Derived collections (shared logic with public profiles) ────────────────
  const allPlaces = [...stopsToPlaces(trips), ...savedPlaces];
  const countries = aggregateCountries(allPlaces);
  const cities = aggregateCities(allPlaces);

  const stats = [
    { id: 'countries', label: 'Countries', value: countries.length, tab: 'countries' },
    { id: 'places',    label: 'Places',    value: allPlaces.length, tab: 'places' },
    { id: 'trips',     label: 'Trips',     value: trips.length,     tab: 'trips' },
    { id: 'following', label: 'Following', value: following.length, tab: null }, // → People page
  ];

  // Badge earned-state, computed from real stats
  const ASIAN_COUNTRIES = ['Japan', 'China', 'Indonesia', 'Thailand', 'Vietnam', 'South Korea', 'Taiwan', 'India', 'Malaysia', 'Philippines'];
  const ISLAND_COUNTRIES = ['Indonesia', 'Philippines', 'Maldives', 'Fiji', 'Iceland', 'Sri Lanka'];
  const badgeProgress = {
    'Foodie 50':     { current: allPlaces.filter(p => p.category === 'food').length, goal: 50 },
    'Jet Setter':    { current: countries.length, goal: 10 },
    'Asia Explorer': { current: countries.filter(c => ASIAN_COUNTRIES.includes(c.name)).length, goal: 5 },
    'Storyteller':   { current: trips.length, goal: 10 },
    'Summit Seeker': { current: allPlaces.filter(p => p.category === 'nature').length, goal: 10 },
    'Island Hopper': { current: countries.filter(c => ISLAND_COUNTRIES.includes(c.name)).length, goal: 5 },
  };

  // ── Tab content (filtered by search + category) ─────────────────────────────
  const q = query.trim().toLowerCase();
  const match = (...fields) => !q || fields.some(f => (f ?? '').toLowerCase().includes(q));

  const filteredTrips = trips.filter(t => match(t.title));
  const filteredPlaces = allPlaces
    .filter(p => catFilter === 'all' || p.category === catFilter)
    .filter(p => match(p.name, p.city, p.country));
  const filteredCountries = countries.filter(c => match(c.name, c.cities));
  const filteredCities = cities.filter(c => match(c.name, c.country));

  const tabContent = {
    trips: filteredTrips.length ? (
      filteredTrips.map(t => (
        <div className="trip-card" key={t.id} style={{ marginBottom: 12 }} onClick={() => navigate('/trips', { state: { tripId: t.id } })}>
          <div className="trip-cover" style={{ background: t.coverBg, height: 90 }}>
            <span style={{ fontSize: 40 }}>{t.coverEmoji}</span>
          </div>
          <div className="trip-info">
            <div className="trip-title">{t.title}</div>
            <div className="trip-meta">
              <span>{t.days} {t.days === 1 ? 'day' : 'days'}</span><span>·</span><span>{t.stops} {t.stops === 1 ? 'stop' : 'stops'}</span>
            </div>
          </div>
        </div>
      ))
    ) : <EmptyState message={q ? `No trips match "${query}"` : 'No trips yet — create one from My Trips!'} />,

    places: filteredPlaces.length ? (
      filteredPlaces.map(p => (
        <div className="place-card" key={p.key} style={{ marginBottom: 10, cursor: 'default' }}>
          <div className="p-thumb" style={{ background: p.bg ?? 'var(--bg3)' }}>{p.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="p-name">{p.name}</div>
            <div className="p-sub">
              {[p.city, p.country].filter(Boolean).join(', ')} · {p.category}
              {p.rating ? <span style={{ color: 'var(--accent)' }}> · {'★'.repeat(p.rating)}</span> : null}
            </div>
          </div>
          <span className="source-tag">{SOURCE_LABEL[p.source] ?? p.source}</span>
          {p.source !== 'trip' && (
            <button
              className="action-btn"
              title={p.source === 'added' ? 'Remove this place' : 'Remove from saved'}
              style={{ padding: '4px 8px', fontSize: 14, color: 'var(--text3)' }}
              onClick={e => handleRemoveSave(e, p)}
            >
              ✕
            </button>
          )}
        </div>
      ))
    ) : <EmptyState message={q || catFilter !== 'all' ? 'No places match those filters.' : 'No places yet — save from the feed, Explore, or add stops to a trip!'} />,

    countries: filteredCountries.length ? (
      filteredCountries.map(c => (
        <div className="country-row" key={c.name}>
          <span className="country-flag">{c.flag || '🌍'}</span>
          <div style={{ flex: 1 }}>
            <div className="country-name">{c.name}</div>
            <div className="country-cities">{c.cities}</div>
          </div>
          <span className="country-count">{c.count} {c.count === 1 ? 'place' : 'places'}</span>
        </div>
      ))
    ) : <EmptyState message={q ? `No countries match "${query}"` : 'No countries yet — add trip stops with locations!'} />,

    cities: filteredCities.length ? (
      filteredCities.map(c => (
        <div className="country-row" key={c.name}>
          <span className="country-flag">{c.flag || '📍'}</span>
          <div style={{ flex: 1 }}>
            <div className="country-name">{c.name}</div>
            {c.country && <div className="country-cities">{c.country}</div>}
          </div>
          <span className="country-count">{c.count} {c.count === 1 ? 'place' : 'places'}</span>
        </div>
      ))
    ) : <EmptyState message={q ? `No cities match "${query}"` : 'No cities yet — your saved and visited places appear here!'} />,
  };

  return (
    <div className="page active" id="page-profile">
      <div className="profile-layout">
        {/* ── Left: identity, stats, condensed achievements + travel style ── */}
        <div className="profile-left">
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: '#E8A87C33', color: '#E8A87C' }}>{initials}</div>
            <div className="profile-name">{displayName}</div>
            <div className="profile-handle">{handle} · joined 2024</div>
          </div>

          <div className="stat-grid">
            {stats.map(s => (
              <div
                key={s.id}
                className={`stat-card${activeTab === s.tab ? ' active' : ''}`}
                onClick={() => s.tab ? selectTab(s.tab) : navigate('/people')}
              >
                <div className="stat-num">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mini-section">
            <div className="sidebar-heading">Achievements</div>
            <div className="mini-badge-grid">
              {BADGES.map(b => {
                const { current = 0, goal = 1 } = badgeProgress[b.name] ?? {};
                const earned = current >= goal;
                return (
                  <div key={b.name} className={`mini-badge${earned ? ' earned' : ''}`} title={b.desc}>
                    <span style={{ fontSize: 16 }}>{b.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                      {earned
                        ? <div style={{ fontSize: 10 }}>✓ Earned</div>
                        : <div className="mini-badge-bar"><div style={{ width: `${Math.min(100, (current / goal) * 100)}%` }} /></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {travelStyle.length > 0 && (
            <div className="mini-section">
              <div className="sidebar-heading">Travel style</div>
              {travelStyle.map(s => (
                <div className="mini-style-row" key={s.label}>
                  <span style={{ width: 84, flexShrink: 0 }}>{s.label}</span>
                  <div className="bar"><div style={{ width: `${s.pct}%`, background: s.color }} /></div>
                  <span style={{ width: 34, textAlign: 'right', color: s.color }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: tabbed collections with search + filters ── */}
        <div className="profile-right">
          <div className="seg-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`seg-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => selectTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <input
            className="search-bar"
            placeholder={TABS.find(t => t.id === activeTab)?.searchHint}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          {activeTab === 'places' && (
            <div className="filter-row">
              <button className={`filter-chip${catFilter === 'all' ? ' active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
              {CATEGORIES.map(c => (
                <button key={c.id} className={`filter-chip${catFilter === c.id ? ' active' : ''}`} onClick={() => setCatFilter(c.id)}>
                  {c.emoji} {c.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <div key={activeTab} style={{ animation: 'fadeUp 0.25s ease' }}>
            {tabContent[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
}
