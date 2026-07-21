import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, CAT_BG } from '../data';
import { tripStatus, STATUS_META } from '../lib/tripStatus';
import { fetchPlaceCommunity } from '../services/community';
import { fetchTrips, updateItinerary } from '../services/trips';
import Avatar from './Avatar';

// The shared "place card" — opened from Explore, the feed, your trips, and
// friends' trips. Shows place details, which friends have been, community
// photos, and save/add-to-trip actions.
//
// props:
//   place          normalized: { name, city, country, countryFlag, category,
//                  emoji, bg, rating, tip, lat, lng, media, visited }
//   onClose()
//   saveState      'unsaved' | 'saved' | 'hidden' — wishlist button state
//   onSaveWishlist() optional — invoked when the wishlist button is pressed
export default function PlaceDetailModal({ place, onClose, saveState = 'hidden', onSaveWishlist }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [community, setCommunity] = useState({ visitors: [], media: [] });
  const [myTrips, setMyTrips] = useState([]);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [addedTo, setAddedTo] = useState(null); // trip title after adding

  const cat = CATEGORIES.find(c => c.id === place.category);

  useEffect(() => {
    let cancelled = false;
    fetchPlaceCommunity(place.name, { excludeUserId: user?.id })
      .then(c => { if (!cancelled) setCommunity(c); })
      .catch(() => {});
    fetchTrips(user?.id)
      .then(ts => { if (!cancelled) setMyTrips(ts); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [place.name, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Community photos + this place's own media, deduped
  const seen = new Set();
  const allMedia = [...(place.media ?? []), ...community.media].filter(m => {
    if (!m?.url || seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  }).slice(0, 8);

  const handleAddToTrip = (trip) => {
    const stop = {
      name: place.name,
      category: place.category || 'food',
      emoji: place.emoji || cat?.emoji || '📍',
      time: 'Anytime',
      tip: place.tip || '',
      rating: place.rating ?? 0,
      lat: place.lat ?? null,
      lng: place.lng ?? null,
      city: place.city ?? '',
      country: place.country ?? '',
      countryFlag: place.countryFlag ?? '',
      visited: place.visited || '',
      media: place.media ?? [],
    };
    const already = (trip.itinerary ?? []).some(d => d.stops.some(s => s.name === place.name));
    if (already) {
      showToast(`${place.name} is already on "${trip.title}"`);
      setShowTripPicker(false);
      return;
    }
    const lastDay = trip.itinerary.at(-1);
    const itinerary = lastDay
      ? trip.itinerary.map(d => d.day === lastDay.day ? { ...d, stops: [...d.stops, stop] } : d)
      : [{ day: 1, label: 'Ideas', stops: [stop] }];
    updateItinerary(trip.id, itinerary).catch(() => showToast('Could not save — check your connection'));
    setAddedTo(trip.title);
    setShowTripPicker(false);
    showToast(`✓ ${place.name} added to "${trip.title}"`);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <div className="p-thumb" style={{ background: place.bg ?? CAT_BG[place.category] ?? 'var(--bg3)', width: 56, height: 56, fontSize: 26 }}>
            {place.emoji || cat?.emoji || '📍'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title" style={{ marginBottom: 2 }}>{place.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              📍 {[place.city, place.country].filter(Boolean).join(', ')} {place.countryFlag}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {cat && <span className="tag" style={{ padding: '2px 8px' }}>{cat.emoji} {cat.label}</span>}
              {place.rating ? <span style={{ color: 'var(--accent)' }}>{'★'.repeat(place.rating)}{'☆'.repeat(5 - place.rating)}</span> : null}
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={onClose}>✕</button>
        </div>

        {place.tip && <div className="post-tip" style={{ marginBottom: 14 }}>"{place.tip}"</div>}

        {/* Community photos */}
        {allMedia.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="sidebar-heading" style={{ marginBottom: 8 }}>Photos from travelers</div>
            <div className="stop-media" style={{ marginTop: 0 }}>
              {allMedia.map((m, i) => (
                <div className="media-thumb" key={i} style={{ width: 84, height: 84 }}>
                  {m.type === 'video' ? <video src={m.url} muted playsInline /> : <img src={m.url} alt="" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends who've been */}
        <div style={{ marginBottom: 16 }}>
          <div className="sidebar-heading" style={{ marginBottom: 8 }}>
            {community.visitors.length ? `Friends who've been · ${community.visitors.length}` : 'Friends who\'ve been'}
          </div>
          {community.visitors.length ? community.visitors.slice(0, 4).map(v => (
            <div className="suggest-row" key={v.user.id} style={{ cursor: 'pointer' }} onClick={() => { onClose(); navigate(`/user/${v.user.username}`); }}>
              <Avatar initials={v.user.initials} color={v.user.color} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {v.user.name}
                  <span style={{ color: 'var(--text3)', fontWeight: 400 }}>
                    {' '}· {v.via === 'trip' ? `on "${v.tripTitle}"` : 'shared on the feed'}
                  </span>
                </div>
                {v.tip && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{v.tip}"</div>}
              </div>
              {v.rating ? <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>{'★'.repeat(v.rating)}</span> : null}
            </div>
          )) : (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              None of your friends have logged this spot yet — be the first!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: 8 }}>
          {saveState !== 'hidden' && (
            <button
              className={saveState === 'saved' ? 'btn-secondary' : 'btn-primary'}
              style={{ flex: 1 }}
              disabled={saveState === 'saved'}
              onClick={onSaveWishlist}
            >
              {saveState === 'saved' ? '✓ On your Want-to-go list' : '💭 Save to Want to go'}
            </button>
          )}
          <button
            className={saveState === 'hidden' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1 }}
            onClick={() => setShowTripPicker(p => !p)}
          >
            {addedTo ? `✓ Added to "${addedTo}"` : '🧳 Add to a trip'}
          </button>
        </div>

        {showTripPicker && (
          <div style={{ marginTop: 10, animation: 'fadeUp 0.2s ease' }}>
            {myTrips.length ? myTrips.map(t => {
              const st = tripStatus(t);
              return (
                <button key={t.id} className="menu-item" style={{ width: '100%' }} onClick={() => handleAddToTrip(t)}>
                  <span>{STATUS_META[st].emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: STATUS_META[st].color }}>{STATUS_META[st].label}</span>
                </button>
              );
            }) : (
              <div style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>
                No trips yet — create one under My Trips first.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
