import { useParams, useNavigate } from 'react-router-dom';
import { USERS, TRIPS, FOLLOWS } from '../../data';

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const profileUser = USERS.find(u => u.username === username);

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

  // TODO: fetch from Supabase: trips where user_id = profileUser.id
  const trips = TRIPS.filter(t => t.user_id === profileUser.id);

  // TODO: fetch from Supabase: count of follows where following_id = profileUser.id
  const followerCount = FOLLOWS.filter(f => f.following_id === profileUser.id).length;

  const topPlaces = profileUser.topPlaces ?? [];
  const travelStyle = profileUser.travelStyle ?? [];

  return (
    <div className="page active" id="page-public-profile">
      <div className="profile-layout">
        <div className="profile-left">
          {/* Header */}
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
            <div className="profile-handle">@{profileUser.username}</div>
            {profileUser.bio && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>{profileUser.bio}</div>
            )}
          </div>

          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-num">{trips.length}</div>
              <div className="stat-label">Trips</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{trips.reduce((n, t) => n + t.stops, 0)}</div>
              <div className="stat-label">Places</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{followerCount}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{topPlaces.length}</div>
              <div className="stat-label">Top picks</div>
            </div>
          </div>

          {/* Top 3 places */}
          <div className="sidebar-heading" style={{ marginBottom: 12 }}>Top places</div>
          {topPlaces.length ? topPlaces.map((p, i) => (
            <div className="place-card" key={i} style={{ marginBottom: 10 }}>
              <div className="p-thumb" style={{ background: 'var(--bg3)' }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="p-name">{p.name}</div>
                <div className="p-sub">{p.city}</div>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>{'★'.repeat(p.rating)}</span>
            </div>
          )) : (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>No places yet.</div>
          )}
        </div>

        <div className="profile-right">
          {/* Trips */}
          <div style={{ marginBottom: 28 }}>
            <div className="section-heading">Trips</div>
            <div className="section-sub">{profileUser.name.split(' ')[0]}'s travel itineraries</div>
            {trips.length ? trips.map(t => (
              <div className="trip-card" key={t.id} style={{ marginBottom: 12 }}>
                <div className="trip-cover" style={{ background: t.coverBg, height: 100 }}>
                  <span style={{ fontSize: 44 }}>{t.coverEmoji}</span>
                </div>
                <div className="trip-info">
                  <div className="trip-title">{t.title}</div>
                  <div className="trip-meta">
                    <span>{t.days} days</span><span>·</span><span>{t.stops} stops</span>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>No trips shared yet.</div>
            )}
          </div>

          {/* Travel style */}
          {travelStyle.length > 0 && (
            <div>
              <div className="section-heading">Travel style</div>
              <div className="section-sub">Based on {profileUser.name.split(' ')[0]}'s saved places</div>
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
          )}
        </div>
      </div>
    </div>
  );
}
