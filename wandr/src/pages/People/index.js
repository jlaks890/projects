import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USERS, FOLLOWS } from '../../data';

export default function PeoplePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Users the logged-in user follows
  // TODO: Supabase — select users.* from follows join users on following_id = users.id where follower_id = user.id
  const following = user
    ? FOLLOWS.filter(f => f.follower_id === user.id).map(f => USERS.find(u => u.id === f.following_id)).filter(Boolean)
    : [];

  // Search: all users except self, filtered by query
  const otherUsers = USERS.filter(u => u.id !== user?.id);
  const searchResults = query.trim().length > 0
    ? otherUsers.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const goToProfile = (username) => navigate(`/user/${username}`);

  return (
    <div className="page active" id="page-people">
      <div className="people-layout">
        <div className="people-left">
          <div className="section-heading">People</div>
          <div className="section-sub">Friends and travelers you follow</div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              className="input-field"
              placeholder="🔍 Search travelers by name or @username..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Search results */}
          {query.trim().length > 0 ? (
            <>
              <div className="sidebar-heading" style={{ marginBottom: 12 }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.length ? searchResults.map(u => (
                <UserRow key={u.id} user={u} onClick={() => goToProfile(u.username)} isFollowing={following.some(f => f.id === u.id)} />
              )) : (
                <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>No travelers found for "{query}"</div>
              )}
            </>
          ) : (
            <>
              {/* Following */}
              <div className="sidebar-heading" style={{ marginBottom: 12 }}>Following · {following.length}</div>
              {following.length ? following.map(u => (
                <UserRow key={u.id} user={u} onClick={() => goToProfile(u.username)} isFollowing />
              )) : (
                <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>
                  Not following anyone yet — search above to find travelers!
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: suggested travelers */}
        <div className="people-right">
          <div className="section-heading">Discover travelers</div>
          <div className="section-sub">People you might want to follow</div>
          {otherUsers
            .filter(u => !following.some(f => f.id === u.id))
            .map(u => (
              <div key={u.id} className="place-card" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => goToProfile(u.username)}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.color + '33', color: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                  {u.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="p-name">{u.name} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>@{u.username}</span></div>
                  <div className="p-sub">{u.bio}</div>
                  <div className="p-friends" style={{ marginTop: 4 }}>
                    {u.travelStyle?.slice(0, 2).map(s => s.label).join(' · ')}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>→</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onClick, isFollowing }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.color + '33', color: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
        {user.initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>@{user.username}</span></div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{user.bio}</div>
      </div>
      {isFollowing && <span style={{ fontSize: 11, color: 'var(--accent2)', border: '1px solid var(--accent2)', borderRadius: 20, padding: '2px 8px' }}>Following</span>}
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>→</span>
    </div>
  );
}
