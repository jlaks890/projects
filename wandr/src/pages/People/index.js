import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchUsers } from '../../services/users';
import { fetchFollowing, followUser, unfollowUser } from '../../services/follows';

export default function PeoplePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchUsers(), fetchFollowing(user.id)]).then(([users, f]) => {
      if (cancelled) return;
      setAllUsers(users);
      setFollowing(f);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFollowing = (u) => following.some(f => f.id === u.id);

  const toggleFollow = (e, u) => {
    e.stopPropagation();
    if (isFollowing(u)) {
      setFollowing(f => f.filter(x => x.id !== u.id));
      unfollowUser(user.id, u.id).catch(() => {});
      showToast(`Unfollowed ${u.name}`);
    } else {
      setFollowing(f => [...f, u]);
      followUser(user.id, u.id).catch(() => {});
      showToast(`✓ Following ${u.name}`);
    }
  };

  // Search: all users except self, filtered by query
  const otherUsers = allUsers.filter(u => u.id !== user?.id);
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
                <UserRow key={u.id} user={u} onClick={() => goToProfile(u.username)} isFollowing={isFollowing(u)} onToggleFollow={toggleFollow} />
              )) : (
                <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>No travelers found for "{query}"</div>
              )}
            </>
          ) : (
            <>
              {/* Following */}
              <div className="sidebar-heading" style={{ marginBottom: 12 }}>Following · {following.length}</div>
              {following.length ? following.map(u => (
                <UserRow key={u.id} user={u} onClick={() => goToProfile(u.username)} isFollowing onToggleFollow={toggleFollow} />
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
            .filter(u => !isFollowing(u))
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
                <button className="follow-btn" onClick={e => toggleFollow(e, u)}>Follow</button>
              </div>
            ))}
          {otherUsers.length > 0 && otherUsers.every(u => isFollowing(u)) && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0' }}>
              You follow everyone here — nice work, social butterfly 🦋
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onClick, isFollowing, onToggleFollow }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.color + '33', color: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
        {user.initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>@{user.username}</span></div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{user.bio}</div>
      </div>
      <button className={`follow-btn${isFollowing ? ' following' : ''}`} onClick={e => onToggleFollow(e, user)}>
        {isFollowing ? '✓ Following' : 'Follow'}
      </button>
    </div>
  );
}
