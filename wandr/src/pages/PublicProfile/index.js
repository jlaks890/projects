import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CATEGORIES, CAT_BG } from '../../data';
import { fetchUserByUsername } from '../../services/users';
import { fetchTrips } from '../../services/trips';
import { fetchUserPlaces } from '../../services/posts';
import { fetchFollowerCount, fetchFollowing, followUser, unfollowUser } from '../../services/follows';
import { stopsToPlaces, aggregateCountries, aggregateCities } from '../../lib/collections';

const TABS = [
  { id: 'trips',     label: 'Trips',     searchHint: '🔍 Search trips by title...' },
  { id: 'places',    label: 'Places',    searchHint: '🔍 Search places by name or city...' },
  { id: 'countries', label: 'Countries', searchHint: '🔍 Search countries...' },
  { id: 'cities',    label: 'Cities',    searchHint: '🔍 Search cities...' },
];

function EmptyState({ message }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text3)', padding: '28px 0', textAlign: 'center', lineHeight: 1.6 }}>
      {message}
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profileUser, setProfileUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [places, setPlaces] = useState([]); // their shared places
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [expandedTripId, setExpandedTripId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExpandedTripId(null);
    setActiveTab('trips');
    setQuery('');
    setCatFilter('all');
    fetchUserByUsername(username)
      .then(async (u) => {
        if (cancelled) return;
        setProfileUser(u);
        if (u) {
          const [t, p, count, myFollowing, theirFollowing] = await Promise.all([
            fetchTrips(u.id),
            fetchUserPlaces(u.id),
            fetchFollowerCount(u.id),
            user ? fetchFollowing(user.id) : [],
            user ? fetchFollowing(u.id) : [],
          ]);
          if (cancelled) return;
          setTrips(t);
          setPlaces(p);
          setFollowerCount(count);
          setIsFollowing(myFollowing.some(f => f.id === u.id));
          setFollowsYou(theirFollowing.some(f => f.id === user?.id));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(n => Math.max(0, n - 1));
      unfollowUser(user.id, profileUser.id).catch(() => {});
      showToast(`Unfollowed ${profileUser.name}`);
    } else {
      setIsFollowing(true);
      setFollowerCount(n => n + 1);
      followUser(user.id, profileUser.id).catch(() => {});
      showToast(`✓ Following ${profileUser.name}`);
    }
  };

  if (loading) return <div className="page active" style={{ flex: 1 }} />;

  if (!profileUser) {
    return (
      <div className="page active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 18, color: 'var(--text)' }}>User not found</div>
          <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const firstName = profileUser.name.split(' ')[0];
  const travelStyle = profileUser.travelStyle ?? [];
  const privacy = profileUser.privacy ?? 'public';

  // ── Privacy gate ────────────────────────────────────────────────────────────
  // public: everything · semi: follow them · private: mutual follow
  const canView =
    privacy === 'public' ||
    (privacy === 'semi' && isFollowing) ||
    (privacy === 'private' && isFollowing && followsYou);

  // ── Derived collections (same logic as own profile) ────────────────────────
  const allPlaces = [...stopsToPlaces(trips), ...places];
  const countries = aggregateCountries(allPlaces);
  const cities = aggregateCities(allPlaces);

  const stats = [
    { id: 'countries', label: 'Countries', value: countries.length, tab: 'countries' },
    { id: 'places',    label: 'Places',    value: allPlaces.length, tab: 'places' },
    { id: 'trips',     label: 'Trips',     value: trips.length,     tab: 'trips' },
    { id: 'followers', label: 'Followers', value: followerCount,    tab: null },
  ];

  const q = query.trim().toLowerCase();
  const match = (...fields) => !q || fields.some(f => (f ?? '').toLowerCase().includes(q));
  const filteredTrips = trips.filter(t => match(t.title));
  const filteredPlaces = allPlaces
    .filter(p => catFilter === 'all' || p.category === catFilter)
    .filter(p => match(p.name, p.city, p.country));
  const filteredCountries = countries.filter(c => match(c.name, c.cities));
  const filteredCities = cities.filter(c => match(c.name, c.country));

  const selectTab = (id) => { setActiveTab(id); setQuery(''); setCatFilter('all'); };

  const tabContent = {
    trips: filteredTrips.length ? (
      filteredTrips.map(t => (
        <div key={t.id} style={{ marginBottom: 12 }}>
          <div
            className={`trip-card${expandedTripId === t.id ? ' active' : ''}`}
            onClick={() => setExpandedTripId(id => id === t.id ? null : t.id)}
          >
            <div className="trip-cover" style={{ background: t.coverBg, height: 90 }}>
              <span style={{ fontSize: 40 }}>{t.coverEmoji}</span>
            </div>
            <div className="trip-info">
              <div className="trip-title">{t.title}</div>
              <div className="trip-meta">
                <span>{t.days} {t.days === 1 ? 'day' : 'days'}</span><span>·</span><span>{t.stops} {t.stops === 1 ? 'stop' : 'stops'}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text3)' }}>{expandedTripId === t.id ? '▴ Hide' : '▾ View itinerary'}</span>
              </div>
            </div>
          </div>
          {expandedTripId === t.id && (
            <div style={{ padding: '14px 4px 4px', animation: 'fadeUp 0.25s ease' }}>
              {t.itinerary.length ? t.itinerary.map(day => (
                <div className="day-block" key={day.day}>
                  <div className="day-header">Day {day.day} — {day.label}</div>
                  {day.stops.map((stop, i) => (
                    <div className="stop-row" key={`${stop.name}-${i}`}>
                      <div className="stop-icon" style={{ background: CAT_BG[stop.category] || '#111' }}>{stop.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div className="stop-name">{stop.name}</div>
                        <div className="stop-detail">{stop.category.charAt(0).toUpperCase() + stop.category.slice(1)} · {stop.time}</div>
                        <div className="stop-stars">{'★'.repeat(stop.rating)}{'☆'.repeat(5 - stop.rating)}</div>
                        {stop.tip && <div className="stop-tip">"{stop.tip}"</div>}
                        {stop.media?.length > 0 && (
                          <div className="stop-media">
                            {stop.media.map((m, j) => (
                              <div className="media-thumb" key={j}>
                                {m.type === 'video' ? <video src={m.url} muted playsInline /> : <img src={m.url} alt="" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )) : (
                <div style={{ fontSize: 13, color: 'var(--text3)', padding: '4px 0 12px' }}>
                  {firstName} hasn't logged the stops for this trip yet.
                </div>
              )}
            </div>
          )}
        </div>
      ))
    ) : <EmptyState message={q ? `No trips match "${query}"` : `${firstName} hasn't shared any trips yet.`} />,

    places: filteredPlaces.length ? (
      filteredPlaces.map(p => (
        <div className="place-card" key={p.key} style={{ marginBottom: 10, cursor: 'default' }}>
          <div className="p-thumb" style={{ background: p.bg ?? CAT_BG[p.category] ?? 'var(--bg3)' }}>{p.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="p-name">{p.name}</div>
            <div className="p-sub">
              {[p.city, p.country].filter(Boolean).join(', ')} · {p.category}
              {p.rating ? <span style={{ color: 'var(--accent)' }}> · {'★'.repeat(p.rating)}</span> : null}
            </div>
          </div>
          <span className="source-tag">{p.source === 'trip' ? 'Trip' : 'Shared'}</span>
        </div>
      ))
    ) : <EmptyState message={q || catFilter !== 'all' ? 'No places match those filters.' : `${firstName} hasn't shared any places yet.`} />,

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
    ) : <EmptyState message={q ? `No countries match "${query}"` : 'No countries logged yet.'} />,

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
    ) : <EmptyState message={q ? `No cities match "${query}"` : 'No cities logged yet.'} />,
  };

  const lockMessage = privacy === 'semi'
    ? `Follow @${profileUser.username} to see their trips, places, countries, and cities.`
    : `@${profileUser.username} keeps their travels fully private — you both need to follow each other to see them.`;

  return (
    <div className="page active" id="page-public-profile">
      <div className="profile-layout">
        {/* ── Left: identity, stats, condensed travel style ── */}
        <div className="profile-left">
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Back
          </button>

          <div className="profile-header">
            <div className="profile-avatar" style={{ background: profileUser.color + '33', color: profileUser.color }}>
              {profileUser.initials}
            </div>
            <div className="profile-name">{profileUser.name}</div>
            <div className="profile-handle">
              @{profileUser.username}
              {privacy !== 'public' && <span title={privacy === 'semi' ? 'Semi-private profile' : 'Private profile'}> · {privacy === 'semi' ? '👥' : '🔒'}</span>}
            </div>
            {profileUser.bio && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>{profileUser.bio}</div>
            )}
            <button className={`follow-btn${isFollowing ? ' following' : ''}`} style={{ marginTop: 14, padding: '8px 22px', fontSize: 13 }} onClick={toggleFollow}>
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>
          </div>

          <div className="stat-grid">
            {stats.map(s => (
              <div
                key={s.id}
                className={`stat-card${canView && activeTab === s.tab ? ' active' : ''}`}
                style={!canView || !s.tab ? { cursor: 'default' } : undefined}
                onClick={() => canView && s.tab && selectTab(s.tab)}
              >
                <div className="stat-num">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {canView && travelStyle.length > 0 && (
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

        {/* ── Right: tabbed collections (gated by privacy) ── */}
        <div className="profile-right">
          {canView ? (
            <>
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
            </>
          ) : (
            <div className="lock-panel">
              <div className="lock-emoji">{privacy === 'semi' ? '👥' : '🔒'}</div>
              <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
                {privacy === 'semi' ? 'This profile is semi-private' : 'This profile is private'}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>{lockMessage}</div>
              {!isFollowing && (
                <button className="follow-btn" style={{ marginTop: 18, padding: '9px 26px', fontSize: 13 }} onClick={toggleFollow}>
                  + Follow {firstName}
                </button>
              )}
              {privacy === 'private' && isFollowing && !followsYou && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 14 }}>
                  You follow {firstName} — waiting for them to follow you back.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
