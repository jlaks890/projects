import { useState } from 'react';
import Avatar from '../../components/Avatar';
import Stars from '../../components/Stars';
import AddPlaceModal from '../../components/AddPlaceModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { POSTS, USERS, FOLLOWS, CATEGORIES } from '../../data';

export default function FeedPage() {
  const [posts, setPosts] = useState(POSTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Stories: users that the logged-in user follows
  const storyUsers = user
    ? FOLLOWS.filter(f => f.follower_id === user.id).map(f => USERS.find(u => u.id === f.following_id)).filter(Boolean)
    : [];

  const handleLike = (id) => setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked } : p));

  const handleSave = (id) => {
    const post = posts.find(p => p.id === id);
    setPosts(ps => ps.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
    showToast(post?.saved ? 'Removed from saved' : '✓ Saved to your list');
  };

  const handleShare = (name) => showToast(`Sharing "${name}"...`);

  const handleAddPlace = (form) => {
    const cat = CATEGORIES.find(c => c.id === form.category) || CATEGORIES[0];
    const newPost = {
      id: Date.now(),
      user_id: user?.id ?? '1',
      place: form.name,
      city: form.city,
      category: form.category || 'food',
      emoji: cat.emoji,
      bg: '#1a1100',
      tip: form.tip || 'Check this place out!',
      rating: form.rating,
      likes: 0, comments: 0, timeAgo: 'just now',
      tags: [form.category || 'food'],
      saved: false,
    };
    setPosts(ps => [newPost, ...ps]);
    showToast('✓ Place posted to your feed!');
  };

  return (
    <div className="page active" id="page-feed">
      <div className="feed-layout">
        <div className="feed-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div className="section-heading">Your feed</div>
              <div className="section-sub">What your friends are discovering</div>
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddModal(true)}>
              + Add place
            </button>
          </div>

          {/* Stories */}
          <div className="story-row">
            <div className="story-item">
              <div className="story-avatar" style={{ background: '#E8A87C33', color: '#E8A87C', borderColor: 'var(--accent)', border: '2px solid var(--accent)', width: 52, height: 52, fontSize: 13 }}>YO</div>
              <span className="story-name">You</span>
            </div>
            {storyUsers.map(u => (
              <div className="story-item" key={u.id}>
                <Avatar initials={u.initials} color={u.color} size={52} hasStory={u.hasStory} />
                <span className="story-name">{u.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          {/* Posts */}
          {posts.map(post => {
            const postUser = USERS.find(u => u.id === post.user_id);
            return (
              <div className="post-card" key={post.id}>
                <div className="post-hero" style={{ background: post.bg }}>
                  <span style={{ fontSize: 72, position: 'relative', zIndex: 1 }}>{post.emoji}</span>
                  <div className="post-hero-overlay" />
                </div>
                <div className="post-body">
                  <div className="post-header">
                    {postUser && <Avatar initials={postUser.initials} color={postUser.color} size={32} />}
                    <span className="post-user">{postUser?.name ?? 'Unknown'}</span>
                    <span className="post-time">{post.timeAgo}</span>
                  </div>
                  <div className="post-place">{post.place}</div>
                  <div className="post-city">📍 {post.city}</div>
                  <Stars n={post.rating} />
                  <div className="post-tip">"{post.tip}"</div>
                  <div className="tag-row">
                    {post.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                  </div>
                  <div className="action-row">
                    <button className={`action-btn${post.liked ? ' liked' : ''}`} onClick={() => handleLike(post.id)}>
                      {post.liked ? '♥' : '♡'} {post.likes + (post.liked ? 1 : 0)}
                    </button>
                    <button className="action-btn">💬 {post.comments}</button>
                    <button className={`action-btn${post.saved ? ' saved' : ''}`} onClick={() => handleSave(post.id)}>
                      {post.saved ? '✓ Saved' : '+ Save'}
                    </button>
                    <button className="action-btn share" onClick={() => handleShare(post.place)}>↑ Share</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar */}
        <div className="feed-right">
          <div className="sidebar-section">
            <div className="sidebar-heading">Trending near you</div>
            {[
              { emoji: '🍵', name: 'Sightglass Coffee',       sub: 'Coffee · SoMa · 0.4mi',    badge: 'Hot',      badgeClass: 'hot',      friends: 12, bg: '#2a1800' },
              { emoji: '🌮', name: 'La Palma Mexicatessen',   sub: 'Food · Mission · 1.1mi',    badge: 'Trending', badgeClass: 'trending', friends: 8,  bg: '#1a0a00' },
              { emoji: '🎨', name: 'Creativity Explored',     sub: 'Art · Mission · 1.4mi',     badge: null,                               friends: 5,  bg: '#0a0a1a' },
            ].map(item => (
              <div className="trending-item" key={item.name}>
                <div className="t-icon" style={{ background: item.bg }}>{item.emoji}</div>
                <div>
                  <div className="t-name">{item.name}</div>
                  <div className="t-sub">{item.sub}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 2 }}>{item.friends} friends saved this</div>
                </div>
                {item.badge && <span className={`t-badge ${item.badgeClass}`}>{item.badge}</span>}
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-heading">Friends' recent trips</div>
            {storyUsers.slice(0, 2).map(u => {
              const trip = POSTS.find(p => p.user_id === u.id); // placeholder until trips feed is built
              return (
                <div className="trending-item" key={u.id}>
                  <Avatar initials={u.initials} color={u.color} size={36} />
                  <div>
                    <div className="t-name">{u.name}</div>
                    <div className="t-sub">{trip ? trip.city : 'Wandr traveler'}</div>
                  </div>
                  <button className="action-btn" style={{ marginLeft: 'auto', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>View</button>
                </div>
              );
            })}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-heading">Suggested for you</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Based on your Japan trips, you might love
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }}> Taiwan's night markets →</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddPlaceModal onClose={() => setShowAddModal(false)} onAdd={handleAddPlace} />}
    </div>
  );
}
