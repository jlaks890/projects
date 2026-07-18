import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../data';
import { loadPlacesLibrary } from '../lib/googleMaps';
import { locationFromAddressComponents, parseCityCountry } from '../lib/places';
import { uploadMedia } from '../services/media';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  name: '', city: '', lat: null, lng: null, category: '', tip: '', rating: 5,
  cityName: '', country: '', countryFlag: '', // structured location (Countries/Cities lists)
  visited: '',                                // date visited (manual; GPS timestamp later)
  media: [],                                  // [{url, type}]
};

export default function AddPlaceModal({ onClose, onAdd }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [suggestions, setSuggestions] = useState([]);
  const [searchStatus, setSearchStatus] = useState('idle'); // idle | searching | ok | unavailable
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const placesRef = useRef(null);       // new Places library, once loaded
  const sessionTokenRef = useRef(null); // groups keystrokes for billing
  const debounceRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadPlacesLibrary()
      .then(lib => {
        placesRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
      })
      .catch(() => setSearchStatus('unavailable')); // no key / blocked → manual entry still works
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleNameChange = (value) => {
    set('name', value);
    clearTimeout(debounceRef.current);
    if (!placesRef.current || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearchStatus(s => s === 'unavailable' ? s : 'searching');
    debounceRef.current = setTimeout(async () => {
      try {
        const { suggestions: results } = await placesRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: sessionTokenRef.current,
        });
        setSuggestions(results.filter(s => s.placePrediction).slice(0, 5));
        setSearchStatus('ok');
      } catch {
        setSuggestions([]);
        setSearchStatus('unavailable'); // most commonly: Places API (New) disabled for this key
      }
    }, 250);
  };

  const pickSuggestion = async (s) => {
    setSuggestions([]);
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] });
      const loc = locationFromAddressComponents(place.addressComponents);
      setForm(f => ({
        ...f,
        name: place.displayName ?? f.name,
        city: loc.city && loc.country ? `${loc.city}, ${loc.country}` : (place.formattedAddress ?? f.city),
        cityName: loc.city,
        country: loc.country,
        countryFlag: loc.countryFlag,
        lat: place.location?.lat() ?? null,
        lng: place.location?.lng() ?? null,
      }));
      sessionTokenRef.current = new placesRef.current.AutocompleteSessionToken();
    } catch {
      // keep whatever the user typed
    }
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all([...files].map(f => uploadMedia(user?.id ?? 'anon', f)));
      setForm(f => ({ ...f, media: [...f.media, ...uploaded] }));
    } catch {
      // upload failed (e.g. storage bucket missing) — keep the rest of the form usable
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeMedia = (i) => setForm(f => ({ ...f, media: f.media.filter((_, j) => j !== i) }));

  const submit = () => {
    // Guarantee structured city/country even for fully manual entries
    const parsed = form.cityName ? form : { ...form, ...(() => {
      const p = parseCityCountry(form.city);
      return { cityName: p.city, country: p.country, countryFlag: p.countryFlag };
    })() };
    onAdd(parsed);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title">Add a place</div>
        <div className="modal-sub">Pin a spot to your feed and itinerary</div>
        <div className="input-group" style={{ position: 'relative' }}>
          <div className="input-label">Place name</div>
          <input
            className="input-field"
            placeholder="Search for a place..."
            value={form.name}
            autoFocus
            onChange={e => handleNameChange(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="menu-pop" style={{ left: 0, right: 0, minWidth: 0 }}>
              {suggestions.map((s, i) => {
                const p = s.placePrediction;
                return (
                  <button key={i} className="menu-item" onClick={() => pickSuggestion(s)}>
                    <span style={{ flexShrink: 0 }}>📍</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text)' }}>{p.mainText?.text ?? p.text?.text}</span>
                      {p.secondaryText?.text && <span style={{ color: 'var(--text3)' }}> · {p.secondaryText.text}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {searchStatus === 'unavailable' && form.name.trim().length >= 3 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
              ⚠ Live place search is unavailable — enable <strong>Places API (New)</strong> for your
              Google Maps key in the Google Cloud console. You can still fill in the details manually.
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="input-group">
            <div className="input-label">City / Location</div>
            <input
              className="input-field"
              placeholder="e.g. Lisbon, Portugal"
              value={form.city}
              onChange={e => set('city', e.target.value)}
            />
          </div>
          <div className="input-group">
            <div className="input-label">Date visited</div>
            <input
              className="input-field"
              type="date"
              value={form.visited}
              onChange={e => set('visited', e.target.value)}
              style={{ colorScheme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' }}
            />
          </div>
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
          <div className="input-label">Photos & videos</div>
          <div className="media-grid">
            {form.media.map((m, i) => (
              <div className="media-thumb" key={i}>
                {m.type === 'video'
                  ? <video src={m.url} muted playsInline />
                  : <img src={m.url} alt="" />}
                <button className="media-remove" onClick={() => removeMedia(i)}>✕</button>
              </div>
            ))}
            <button className="media-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '…' : '+'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
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
          <button className="btn-primary" onClick={submit} disabled={!form.name || !form.city || uploading}>Post place</button>
        </div>
      </div>
    </div>
  );
}
