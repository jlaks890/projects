import { useState, useEffect } from 'react';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers } from '../../services/users';

export default function StepFollowFriends({ data, onChange }) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchUsers().then(users => {
      if (!cancelled) setCandidates(users.filter(u => u.id !== user?.id && u.id !== '1'));
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const toggle = (id) => {
    const following = data.following.includes(id)
      ? data.following.filter(f => f !== id)
      : [...data.following, id];
    onChange({ following });
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-emoji">👥</div>
      <div className="onboarding-title">Follow your first friends</div>
      <div className="onboarding-sub">See where the people you know are traveling</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {candidates.map(u => {
          const isFollowing = data.following.includes(u.id);
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <Avatar initials={u.initials} color={u.color} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.bio}</div>
              </div>
              <button
                className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                style={{ width: 'auto', padding: '8px 16px' }}
                onClick={() => toggle(u.id)}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
