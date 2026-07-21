import { useState } from 'react';
import { CATEGORIES, EXPLORE_PLACES } from '../../data';
import Map from '../../components/Map';
import PlaceDetailModal from '../../components/PlaceDetailModal';
import { useToast } from '../../context/ToastContext';
import { isExploreSaved, setExploreSaved } from '../../services/saves';

const DEFAULT_CENTER = { lat: 37.787, lng: -122.43 };

// EXPLORE_PLACES entry → normalized place for the detail card
const toPlace = (p) => ({
  name: p.name, city: 'San Francisco', country: 'United States', countryFlag: '🇺🇸',
  category: p.category, emoji: p.emoji, bg: p.bg, rating: null, tip: '',
  lat: p.lat, lng: p.lng, media: [],
});

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [savedIds, setSavedIds] = useState(
    () => new Set(EXPLORE_PLACES.filter(p => isExploreSaved(p.id)).map(p => p.id))
  );
  const [focus, setFocus] = useState(null); // {lat, lng} of the selected place
  const [detailPlace, setDetailPlace] = useState(null); // EXPLORE_PLACES entry in the detail card
  const { showToast } = useToast();

  const q = query.trim().toLowerCase();
  const places = EXPLORE_PLACES
    .filter(p => activeFilter === 'all' || p.category === activeFilter)
    .filter(p => !q || p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));

  const pins = places.map(p => ({ id: p.id, emoji: p.emoji, lat: p.lat, lng: p.lng, label: p.name, category: p.category }));

  const toggleSave = (e, place) => {
    e.stopPropagation();
    const saved = savedIds.has(place.id);
    const next = new Set(savedIds);
    if (saved) next.delete(place.id);
    else next.add(place.id);
    setSavedIds(next);
    setExploreSaved(place.id, !saved); // shows up under Profile → Places
    showToast(saved ? 'Removed from saved' : `💭 ${place.name} saved to Want to go`);
  };

  // Card click: pan the map AND open the place detail card
  const focusPlace = (place) => {
    setFocus({ lat: place.lat, lng: place.lng });
    setDetailPlace(place);
  };

  const saveFromModal = () => {
    if (!detailPlace || savedIds.has(detailPlace.id)) return;
    setSavedIds(prev => new Set(prev).add(detailPlace.id));
    setExploreSaved(detailPlace.id, true);
    showToast(`💭 ${detailPlace.name} saved to Want to go`);
  };

  return (
    <div className="page active" id="page-explore">
      <div className="explore-layout">
        <div className="explore-left">
          <div className="section-heading">Explore</div>
          <div className="section-sub">Discover where your friends have been</div>
          <input
            className="search-bar"
            placeholder="🔍 Search places, cities, food..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="filter-row">
            <button className={`filter-chip${activeFilter === 'all' ? ' active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`filter-chip${activeFilter === c.id ? ' active' : ''}`} onClick={() => setActiveFilter(c.id)}>
                {c.emoji} {c.label.split(' ')[0]}
              </button>
            ))}
          </div>
          {places.map(p => (
            <div className="place-card" key={p.id} onClick={() => focusPlace(p)}>
              <div className="p-thumb" style={{ background: p.bg }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="p-name">{p.name}{p.verified && <span className="verified"> ✓</span>}</div>
                <div className="p-sub">{p.sub}</div>
                <div className="p-friends">{p.friends + (savedIds.has(p.id) ? 1 : 0)} friends saved this</div>
              </div>
              <button
                className={`action-btn${savedIds.has(p.id) ? ' saved' : ''}`}
                style={{ padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
                onClick={e => toggleSave(e, p)}
              >
                {savedIds.has(p.id) ? '✓ Saved' : '+ Save'}
              </button>
            </div>
          ))}
          {places.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0', textAlign: 'center' }}>
              No places match "{query}" — try a different search.
            </div>
          )}
        </div>
        <div className="explore-right">
          <div className="map-container">
            <Map pins={pins} center={focus ?? DEFAULT_CENTER} zoom={focus ? 15 : 13} />
            <div className="map-overlay-text">
              <strong>{pins.length} friend pins</strong> · San Francisco, CA
            </div>
          </div>
        </div>
      </div>

      {detailPlace && (
        <PlaceDetailModal
          place={toPlace(detailPlace)}
          onClose={() => setDetailPlace(null)}
          saveState={savedIds.has(detailPlace.id) ? 'saved' : 'unsaved'}
          onSaveWishlist={saveFromModal}
        />
      )}
    </div>
  );
}
