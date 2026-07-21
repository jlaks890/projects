import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import Stars from '../../components/Stars';
import AddPlaceModal from '../../components/AddPlaceModal';
import PlaceDetailModal from '../../components/PlaceDetailModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../data';
import { shareContent } from '../../lib/share';
import { fetchFeed, createPost, setLiked, setSaved } from '../../services/posts';
import { fetchFollowing } from '../../services/follows';
import { fetchUsers } from '../../services/users';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [storyUsers, setStoryUsers] = useState([]); // users the logged-in user follows
  const [feedTab, setFeedTab] = useState('friends'); // 'friends' | 'everyone'
  const [showAddModal, setShowAddModal] = useState(false);
  const [openComments, setOpenComments] = useState(null); // post id with composer open
  const [detailPost, setDetailPost] = useState(null);      // post shown in the place detail card
  const [comments, setComments] = useState({});           // post id → [{author, text}] (local until comments table exists)
  const [draft, setDraft] = useState('');
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchFeed(user.id), fetchUsers(), fetchFollowing(user.id)])
      .then(([feed, allUsers, following]) => {
        if (cancelled) return;
        setPosts(feed);
        setUsers(allUsers);
        setStoryUsers(following);
      })
      .catch(() => showToast('Could not load your feed'));
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const liked = !post.liked;
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked } : p));
    setLiked(user.id, id, liked).catch(() => {});
  };

  const handleSave = (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const saved = !post.saved;
    setPosts(ps => ps.map(p => p.id === id ? { ...p, saved } : p));
    setSaved(user.id, id, saved).catch(() => {});
    showToast(saved ? '💭 Saved to Want to go — find it under Profile → Places' : 'Removed from saved');
  };

  const handleShare = async (post) => {
    const result = await shareContent({
      title: `${post.place} on Wandr`,
      text: `${post.place} — ${post.city}. "${post.tip}"`,
      url: window.location.origin,
    });
    if (result === 'copied') showToast('✓ Copied to clipboard');
    else if (result === 'shared') showToast('✓ Shared!');
  };

  // Feed post → normalized place for the shared detail card
  const postToPlace = (post) => ({
    name: post.place,
    city: (post.city ?? '').split(',')[0].trim(),
    country: post.country ?? '',
    countryFlag: post.countryFlag ?? '',
    category: post.category,
    emoji: post.emoji,
    bg: post.bg,
    rating: post.rating,
    tip: post.tip,
    lat: post.lat ?? null,
    lng: post.lng ?? null,
    media: post.media ?? [],
    visited: post.visited ?? '',
  });

  const handleComment = (postId) => {
    setDraft('');
    setOpenComments(open => open === postId ? null : postId);
  };

  const postComment = (postId) => {
    if (!draft.trim()) return;
    setComments(c => ({ ...c, [postId]: [...(c[postId] ?? []), { author: profile?.name ?? 'You', text: draft.trim() }] }));
    setDraft('');
  };

  const handleAddPlace = async (form) => {
    const cat = CATEGORIES.find(c => c.id === form.category) || CATEGORIES[0];
    try {
      const newPost = await createPost(user.id, { ...form, emoji: cat.emoji });
      setPosts(ps => [newPost, ...ps]);
      showToast('✓ Place posted to your feed!');
    } catch {
      showToast('Could not post place — try again');
    }
  };

  // Friends tab: posts from people you follow (and your own); Everyone: all posts
  const followedIds = new Set(storyUsers.map(u => u.id));
  const visiblePosts = feedTab === 'friends'
    ? posts.filter(p => followedIds.has(p.user_id) || p.user_id === user?.id)
    : posts;

  return (
    <div className="page active" id="page-feed">
      <div className="feed-layout">
        <div className="feed-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div className="section-heading">Your feed</div>
              <div className="section-sub">What your friends are discovering</div>
            </div>
            <button
              className="btn-primary"
              style={{ flex: 'none', width: 'auto', padding: '9px 16px', fontSize: 13, borderRadius: 'var(--r)', whiteSpace: 'nowrap' }}
              onClick={() => setShowAddModal(true)}
            >
              + Add place
            </button>
          </div>

          {/* Stories */}
          <div className="story-row">
            <div className="story-item" onClick={() => navigate('/profile')}>
              <div className="story-avatar" style={{ background: '#E8A87C33', color: '#E8A87C', borderColor: 'var(--accent)', border: '2px solid var(--accent)', width: 52, height: 52, fontSize: 13 }}>YO</div>
              <span className="story-name">You</span>
            </div>
            {storyUsers.map(u => (
              <div className="story-item" key={u.id} onClick={() => navigate(`/user/${u.username}`)}>
                <Avatar initials={u.initials} color={u.color} size={52} hasStory={u.hasStory} />
                <span className="story-name">{u.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          {/* Friends vs Everyone */}
          <div className="seg-tabs">
            <button className={`seg-tab${feedTab === 'friends' ? ' active' : ''}`} onClick={() => setFeedTab('friends')}>
              👥 Friends
            </button>
            <button className={`seg-tab${feedTab === 'everyone' ? ' active' : ''}`} onClick={() => setFeedTab('everyone')}>
              🌍 Everyone
            </button>
          </div>

          {feedTab === 'friends' && visiblePosts.length === 0 && posts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)', animation: 'fadeUp 0.3s ease' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧭</div>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 6 }}>Nothing from friends yet</div>
              <div style={{ fontSize: 13, marginBottom: 18 }}>Follow travelers to fill this feed — or see what everyone is sharing.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" style={{ flex: 'none', width: 'auto', padding: '10px 18px' }} onClick={() => navigate('/people')}>Find travelers</button>
                <button className="btn-secondary" onClick={() => setFeedTab('everyone')}>Browse everyone</button>
              </div>
            </div>
          )}

          {/* Posts */}
          {visiblePosts.map(post => {
            const postUser = users.find(u => u.id === post.user_id);
            return (
              <div className="post-card" key={post.id}>
                <div className="post-hero" style={{ background: post.bg, cursor: 'pointer' }} onClick={() => setDetailPost(post)}>
                  {post.media?.length ? (
                    post.media[0].type === 'video'
                      ? <video src={post.media[0].url} muted playsInline autoPlay loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={post.media[0].url} alt={post.place} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 72, position: 'relative', zIndex: 1 }}>{post.emoji}</span>
                  )}
                  <div className="post-hero-overlay" />
                </div>
                <div className="post-body">
                  <div className="post-header">
                    {postUser && <Avatar initials={postUser.initials} color={postUser.color} size={32} />}
                    <span className="post-user">{postUser?.name ?? 'You'}</span>
                    <span className="post-time">{post.timeAgo}</span>
                  </div>
                  <div className="post-place" style={{ cursor: 'pointer' }} title="View place details" onClick={() => setDetailPost(post)}>{post.place}</div>
                  <div className="post-city">
                    📍 {post.city}
                    {post.visited && <span style={{ color: 'var(--text3)' }}> · visited {new Date(`${post.visited}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                  <Stars n={post.rating} />
                  <div className="post-tip">"{post.tip}"</div>
                  <div className="tag-row">
                    {post.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                  </div>
                  <div className="action-row">
                    <button className={`action-btn${post.liked ? ' liked' : ''}`} onClick={() => handleLike(post.id)}>
                      {post.liked ? '♥' : '♡'} {post.likes + (post.liked ? 1 : 0)}
                    </button>
                    <button className="action-btn" onClick={() => handleComment(post.id)}>
                      💬 {post.comments + (comments[post.id]?.length ?? 0)}
                    </button>
                    <button className={`action-btn${post.saved ? ' saved' : ''}`} onClick={() => handleSave(post.id)}>
                      {post.saved ? '✓ Saved' : '+ Save'}
                    </button>
                    <button className="action-btn share" onClick={() => handleShare(post)}>↑ Share</button>
                  </div>

                  {openComments === post.id && (
                    <div className="comment-box">
                      {(comments[post.id] ?? []).map((c, i) => (
                        <div className="comment-row" key={i}>
                          <div className="comment-bubble">
                            <span className="comment-author">{c.author}</span>
                            {c.text}
                          </div>
                        </div>
                      ))}
                      <div className="comment-input-row">
                        <input
                          className="input-field"
                          placeholder="Add a comment..."
                          value={draft}
                          autoFocus
                          onChange={e => setDraft(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && postComment(post.id)}
                        />
                        <button className="btn-primary" style={{ flex: 'none', padding: '10px 16px' }} disabled={!draft.trim()} onClick={() => postComment(post.id)}>
                          Post
                        </button>
                      </div>
                    </div>
                  )}
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
              <div className="trending-item" key={item.name} onClick={() => navigate('/explore')}>
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
              const post = posts.find(p => p.user_id === u.id); // placeholder until trips feed is built
              return (
                <div className="trending-item" key={u.id} onClick={() => navigate(`/user/${u.username}`)}>
                  <Avatar initials={u.initials} color={u.color} size={36} />
                  <div>
                    <div className="t-name">{u.name}</div>
                    <div className="t-sub">{post ? post.city : 'Wandr traveler'}</div>
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
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/explore')}> Taiwan's night markets →</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddPlaceModal onClose={() => setShowAddModal(false)} onAdd={handleAddPlace} />}
      {detailPost && (
        <PlaceDetailModal
          place={postToPlace(detailPost)}
          onClose={() => setDetailPost(null)}
          saveState={detailPost.user_id === user?.id ? 'hidden' : (posts.find(p => p.id === detailPost.id)?.saved ? 'saved' : 'unsaved')}
          onSaveWishlist={() => {
            if (!posts.find(p => p.id === detailPost.id)?.saved) handleSave(detailPost.id);
          }}
        />
      )}
    </div>
  );
}
