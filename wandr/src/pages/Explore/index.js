import { useState } from 'react';
import { CATEGORIES, MAP_PINS } from '../../data';
import Map from '../../components/Map';

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const pins = activeFilter === 'all' ? MAP_PINS : MAP_PINS.filter(p => p.category === activeFilter);

  const places = [
    { emoji: '🍜', name: 'Mensho Tokyo Ramen', sub: 'Food · Japantown · 0.8mi', friends: 12, verified: true, bg: '#2a1a0e', category: 'food' },
    { emoji: '☕', name: 'Tartine Manufactory', sub: 'Coffee · Mission · 1.2mi', friends: 18, verified: true, bg: '#1a1200', category: 'food' },
    { emoji: '🌉', name: 'Golden Gate Bridge', sub: 'Nature · Presidio · 3mi', friends: 44, verified: true, bg: '#0a1520', category: 'nature' },
    { emoji: '🎨', name: 'SFMOMA', sub: 'Culture · SoMa · 0.5mi', friends: 9, verified: true, bg: '#0a0a1a', category: 'culture' },
    { emoji: '🛍', name: 'Haight-Ashbury Vintage', sub: 'Shopping · Haight · 2mi', friends: 6, verified: false, bg: '#1a0a1a', category: 'shopping' },
    { emoji: '🍸', name: 'Trick Dog', sub: 'Nightlife · Mission · 1.5mi', friends: 15, verified: true, bg: '#0a0a0a', category: 'nightlife' },
  ].filter(p => activeFilter === 'all' || p.category === activeFilter);

  return (
    <div className="page active" id="page-explore">
      <div className="explore-layout">
        <div className="explore-left">
          <div className="section-heading">Explore</div>
          <div className="section-sub">Discover where your friends have been</div>
          <div className="search-bar">🔍 Search places, cities, food...</div>
          <div className="filter-row">
            <button className={`filter-chip${activeFilter === 'all' ? ' active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`filter-chip${activeFilter === c.id ? ' active' : ''}`} onClick={() => setActiveFilter(c.id)}>
                {c.emoji} {c.label.split(' ')[0]}
              </button>
            ))}
          </div>
          {places.map(p => (
            <div className="place-card" key={p.name}>
              <div className="p-thumb" style={{ background: p.bg }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="p-name">{p.name}{p.verified && <span className="verified"> ✓</span>}</div>
                <div className="p-sub">{p.sub}</div>
                <div className="p-friends">{p.friends} friends saved this</div>
              </div>
              <button className="action-btn" style={{ padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>+ Save</button>
            </div>
          ))}
        </div>
        <div className="explore-right">
          <div className="map-container">
            <Map pins={pins} />
            <div className="map-overlay-text">
              <strong>{pins.length} friend pins</strong> · San Francisco, CA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
