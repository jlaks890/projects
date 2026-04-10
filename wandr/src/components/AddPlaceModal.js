import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../data';
import { loadGoogleMaps } from '../lib/googleMaps';

export default function AddPlaceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', city: '', lat: null, lng: null, category: '', tip: '', rating: 5 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const nameInputRef = useRef(null);

  // Attach Places Autocomplete to the place name input
  useEffect(() => {
    loadGoogleMaps().then(() => {
      const autocomplete = new window.google.maps.places.Autocomplete(nameInputRef.current, {
        types: ['establishment'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setForm(f => ({
          ...f,
          name: place.name || f.name,
          city: place.formatted_address || f.city,
          lat: place.geometry?.location.lat() ?? null,
          lng: place.geometry?.location.lng() ?? null,
        }));
      });
    });
  }, []);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add a place</div>
        <div className="modal-sub">Pin a spot to your feed and itinerary</div>
        <div className="input-group">
          <div className="input-label">Place name</div>
          <input
            ref={nameInputRef}
            className="input-field"
            placeholder="Search for a place..."
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div className="input-group">
          <div className="input-label">City / Location</div>
          <input
            className="input-field"
            placeholder="Auto-filled from place search"
            value={form.city}
            onChange={e => set('city', e.target.value)}
          />
        </div>
        <div className="input-group">
          <div className="input-label">Category</div>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-btn${form.category === c.id ? ' selected' : ''}`} onClick={() => set('category', c.id)}>
                {c.emoji} {c.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="input-group">
          <div className="input-label">Your tip</div>
          <textarea className="input-field" placeholder="What makes it special? Hidden gems, best dish, when to go..." value={form.tip} onChange={e => set('tip', e.target.value)} />
        </div>
        <div className="input-group">
          <div className="input-label">Rating: {form.rating} / 5</div>
          <input type="range" min="1" max="5" step="1" value={form.rating} onChange={e => set('rating', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onAdd(form); onClose(); }} disabled={!form.name || !form.city}>Post place</button>
        </div>
      </div>
    </div>
  );
}
