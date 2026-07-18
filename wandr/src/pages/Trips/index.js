import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, CAT_BG } from '../../data';
import { shareContent, copyText } from '../../lib/share';
import { parseCityCountry } from '../../lib/places';
import { fetchTrips, createTrip, updateItinerary } from '../../services/trips';
import AddPlaceModal from '../../components/AddPlaceModal';
import Map from '../../components/Map';

const COVER_OPTIONS = [
  { emoji: '✈', bg: '#0a1520' },
  { emoji: '🗾', bg: '#0a1520' },
  { emoji: '🌮', bg: '#1a0800' },
  { emoji: '⛩', bg: '#1a0a0a' },
  { emoji: '🌴', bg: '#0a1a0a' },
  { emoji: '🗼', bg: '#0a0a1a' },
  { emoji: '🏔', bg: '#0a1218' },
  { emoji: '🏖', bg: '#1a1400' },
];

const tripSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const countStops = (itinerary) => itinerary.reduce((n, d) => n + d.stops.length, 0);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const dateRange = (start, end) => {
  if (!start && !end) return null;
  if (start && end) return `${fmtDate(start)} → ${fmtDate(end)}`;
  return fmtDate(start ?? end);
};

export default function TripsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [myTrips, setMyTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [addStopDay, setAddStopDay] = useState(null); // day number the add-stop modal targets
  const [addingDay, setAddingDay] = useState(false);  // inline "name your day" composer open
  const [dayLabel, setDayLabel] = useState('');
  const [editingDay, setEditingDay] = useState(null); // { day, value } — renaming a day description
  const [openMenu, setOpenMenu] = useState(null);     // `${day}-${index}` of the open ⋯ menu
  const [view, setView] = useState('list');           // 'list' | 'map'
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchTrips(user.id).then(trips => {
      if (cancelled) return;
      setMyTrips(trips);
      const preselect = location.state?.tripId != null
        ? trips.find(t => t.id === location.state.tripId)
        : null;
      setActiveTrip(prev => preselect ?? prev ?? trips[0] ?? null);
    }).catch(() => showToast('Could not load trips'));
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trip creation ──────────────────────────────────────────────────────────
  const handleCreateTrip = async ({ title, coverEmoji, coverBg }) => {
    try {
      const trip = await createTrip(user.id, { title, coverEmoji, coverBg });
      setMyTrips(ts => [trip, ...ts]);
      setActiveTrip(trip);
      setShowNewTrip(false);
      showToast(`✓ Trip "${title}" created — add your first stop!`);
    } catch {
      showToast('Could not create trip — try again');
    }
  };

  // ── Itinerary mutations (optimistic; write through the service) ────────────
  const applyItinerary = (itinerary) => {
    const updated = { ...activeTrip, itinerary, days: itinerary.length, stops: countStops(itinerary) };
    setActiveTrip(updated);
    setMyTrips(ts => ts.map(t => t.id === updated.id ? updated : t));
    updateItinerary(updated.id, itinerary).catch(() => showToast('Could not save — check your connection'));
  };

  const handleAddDay = () => {
    const nextDay = (activeTrip.itinerary.at(-1)?.day ?? 0) + 1;
    const label = dayLabel.trim() || `Day ${nextDay}`;
    applyItinerary([...activeTrip.itinerary, { day: nextDay, label, stops: [] }]);
    setAddingDay(false);
    setDayLabel('');
    showToast(`✓ Day ${nextDay} — ${label}`);
  };

  const handleRenameDay = () => {
    if (!editingDay) return;
    const label = editingDay.value.trim() || `Day ${editingDay.day}`;
    applyItinerary(activeTrip.itinerary.map(d => d.day === editingDay.day ? { ...d, label } : d));
    setEditingDay(null);
  };

  const handleAddStop = (form) => {
    const cat = CATEGORIES.find(c => c.id === form.category) || CATEGORIES[0];
    const parsed = form.cityName ? form : { ...form, ...parseCityCountry(form.city) };
    const stop = {
      name: form.name,
      category: form.category || 'food',
      emoji: cat.emoji,
      time: 'Anytime',
      tip: form.tip || '',
      rating: form.rating,
      lat: form.lat,
      lng: form.lng,
      city: parsed.cityName || parsed.city || form.city,
      country: parsed.country || '',
      countryFlag: parsed.countryFlag || '',
      visited: form.visited || '',
      media: form.media ?? [],
    };
    const itinerary = activeTrip.itinerary.map(d =>
      d.day === addStopDay ? { ...d, stops: [...d.stops, stop] } : d
    );
    applyItinerary(itinerary);
    showToast(`✓ Added ${form.name} to day ${addStopDay}`);
  };

  const handleRemoveStop = (day, index) => {
    const itinerary = activeTrip.itinerary.map(d =>
      d.day === day ? { ...d, stops: d.stops.filter((_, i) => i !== index) } : d
    );
    setOpenMenu(null);
    applyItinerary(itinerary);
    showToast('Stop removed');
  };

  const handleMoveStop = (day, index, dir) => {
    const itinerary = activeTrip.itinerary.map(d => {
      if (d.day !== day) return d;
      const stops = [...d.stops];
      const j = index + dir;
      if (j < 0 || j >= stops.length) return d;
      [stops[index], stops[j]] = [stops[j], stops[index]];
      return { ...d, stops };
    });
    setOpenMenu(null);
    applyItinerary(itinerary);
  };

  // ── Sharing ────────────────────────────────────────────────────────────────
  const tripUrl = (trip) => `https://wandr.app/you/${tripSlug(trip.title)}`;

  const handleCopyLink = async () => {
    await copyText(tripUrl(activeTrip));
    showToast('✓ Link copied to clipboard');
  };

  const handleShare = async () => {
    const result = await shareContent({
      title: activeTrip.title,
      text: `My trip "${activeTrip.title}" on Wandr — ${activeTrip.days} days, ${countStops(activeTrip.itinerary)} stops`,
      url: tripUrl(activeTrip),
    });
    if (result === 'copied') showToast('✓ Trip link copied to clipboard');
    else if (result === 'shared') showToast('✓ Trip shared!');
  };

  const allStops = activeTrip?.itinerary.flatMap(d => d.stops).filter(s => s.lat && s.lng) ?? [];
  const mapPins = allStops.map((s, i) => ({ id: i, emoji: s.emoji, lat: s.lat, lng: s.lng, label: s.name, category: s.category }));
  const mapCenter = mapPins.length
    ? { lat: mapPins.reduce((n, p) => n + p.lat, 0) / mapPins.length, lng: mapPins.reduce((n, p) => n + p.lng, 0) / mapPins.length }
    : undefined;

  return (
    <div className="page active" id="page-trips">
      <div className="trips-layout">
        <div className="trips-left">
          <div className="section-heading">My trips</div>
          <div className="section-sub">Your travel itineraries</div>
          {myTrips.map(trip => (
            <div
              key={trip.id}
              className={`trip-card${activeTrip?.id === trip.id ? ' active' : ''}`}
              onClick={() => { setActiveTrip(trip); setView('list'); setAddingDay(false); setOpenMenu(null); }}
            >
              <div className="trip-cover" style={{ background: trip.coverBg }}>
                <span style={{ fontSize: 52 }}>{trip.coverEmoji}</span>
              </div>
              <div className="trip-info">
                <div className="trip-title">{trip.title}</div>
                <div className="trip-meta">
                  <span>{plural(trip.days, 'day')}</span>
                  <span>·</span>
                  <span>{plural(trip.stops, 'stop')}</span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent2)' }}>Shared with {trip.sharedWith}</span>
                </div>
                {dateRange(trip.startDate, trip.endDate) && (
                  <div className="trip-meta" style={{ marginTop: 4 }}>📅 {dateRange(trip.startDate, trip.endDate)}</div>
                )}
              </div>
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: 4 }} onClick={() => setShowNewTrip(true)}>
            + New trip
          </button>
        </div>

        <div className="trips-right">
          {!activeTrip && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧳</div>
              <div style={{ fontSize: 16, color: 'var(--text2)' }}>No trips yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Create your first trip to start logging places.</div>
            </div>
          )}
          {activeTrip && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div className="section-heading">{activeTrip.title}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span>{plural(activeTrip.itinerary.length || activeTrip.days, 'day')}</span>
                    <span>·</span>
                    <span>{plural(countStops(activeTrip.itinerary) || activeTrip.stops, 'stop')}</span>
                    {dateRange(activeTrip.startDate, activeTrip.endDate) && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'var(--accent2)' }}>📅 {dateRange(activeTrip.startDate, activeTrip.endDate)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="share-section">
                <div className="share-title">Share "{activeTrip.title}"</div>
                <div className="share-link" style={{ cursor: 'pointer' }} onClick={handleCopyLink}>
                  wandr.app/you/{tripSlug(activeTrip.title)} →
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <button className="share-btn" onClick={handleShare}>📲 Send to Wandr friends</button>
                  <button className="share-btn" onClick={handleShare}>📸 Instagram story</button>
                  <button className="share-btn" onClick={handleCopyLink}>🔗 Copy link</button>
                  <button className="share-btn" onClick={handleShare}>💬 WhatsApp / iMessage</button>
                </div>
                <div className="export-row">
                  <button
                    className="export-btn"
                    style={view === 'map' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                    onClick={() => {
                      if (!mapPins.length) { showToast('No mappable stops yet — add stops first'); return; }
                      setView('map');
                    }}
                  >
                    🗺 Map view
                  </button>
                  <button
                    className="export-btn"
                    style={view === 'list' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                    onClick={() => setView('list')}
                  >
                    📋 List
                  </button>
                  <button className="export-btn" onClick={handleShare}>📖 Story</button>
                  <button className="export-btn" onClick={() => window.print()}>📄 PDF</button>
                </div>
              </div>

              {view === 'map' && (
                <div style={{ height: 420, borderRadius: 'var(--r2)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20, animation: 'fadeUp 0.25s ease' }}>
                  <Map pins={mapPins} center={mapCenter} zoom={12} fit />
                </div>
              )}

              {view === 'list' && activeTrip.itinerary.map(day => (
                <div className="day-block" key={day.day}>
                  {editingDay?.day === day.day ? (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, animation: 'fadeUp 0.15s ease' }}>
                      <input
                        className="input-field"
                        style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
                        value={editingDay.value}
                        autoFocus
                        onChange={e => setEditingDay(ed => ({ ...ed, value: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameDay();
                          if (e.key === 'Escape') setEditingDay(null);
                        }}
                      />
                      <button className="btn-primary" style={{ flex: 'none', width: 'auto', padding: '6px 14px', fontSize: 13 }} onClick={handleRenameDay}>Save</button>
                      <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setEditingDay(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="day-header">
                      Day {day.day} — {day.label}
                      <button
                        title="Edit day description"
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}
                        onClick={() => setEditingDay({ day: day.day, value: day.label })}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  {day.stops.map((stop, i) => (
                    <div className="stop-row" key={`${stop.name}-${i}`}>
                      <div className="stop-icon" style={{ background: CAT_BG[stop.category] || '#111' }}>{stop.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div className="stop-name">{stop.name}</div>
                        <div className="stop-detail">
                          {stop.category.charAt(0).toUpperCase() + stop.category.slice(1)} · {stop.time}
                          {stop.visited && <span style={{ color: 'var(--accent2)' }}> · 📅 {fmtDate(stop.visited)}</span>}
                        </div>
                        <div className="stop-stars">{'★'.repeat(stop.rating)}{'☆'.repeat(5 - stop.rating)}</div>
                        {stop.tip && <div className="stop-tip">"{stop.tip}"</div>}
                        {stop.media?.length > 0 && (
                          <div className="stop-media">
                            {stop.media.map((m, j) => (
                              <div className="media-thumb" key={j}>
                                {m.type === 'video'
                                  ? <video src={m.url} muted playsInline />
                                  : <img src={m.url} alt="" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="menu-wrap">
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
                          onClick={() => setOpenMenu(m => m === `${day.day}-${i}` ? null : `${day.day}-${i}`)}
                        >
                          ⋯
                        </button>
                        {openMenu === `${day.day}-${i}` && (
                          <div className="menu-pop">
                            <button className="menu-item" disabled={i === 0} onClick={() => handleMoveStop(day.day, i, -1)}>↑ Move up</button>
                            <button className="menu-item" disabled={i === day.stops.length - 1} onClick={() => handleMoveStop(day.day, i, 1)}>↓ Move down</button>
                            <button className="menu-item danger" onClick={() => handleRemoveStop(day.day, i)}>✕ Remove stop</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    className="action-btn"
                    style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r)', padding: '8px 14px', width: '100%', justifyContent: 'center', color: 'var(--text3)' }}
                    onClick={() => setAddStopDay(day.day)}
                  >
                    + Add stop to day {day.day}
                  </button>
                </div>
              ))}

              {view === 'list' && (
                addingDay ? (
                  <div style={{ display: 'flex', gap: 8, animation: 'fadeUp 0.2s ease' }}>
                    <input
                      className="input-field"
                      style={{ flex: 1 }}
                      placeholder={`Name day ${(activeTrip.itinerary.at(-1)?.day ?? 0) + 1} — e.g. "Arrive & Eat"`}
                      value={dayLabel}
                      autoFocus
                      onChange={e => setDayLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddDay();
                        if (e.key === 'Escape') { setAddingDay(false); setDayLabel(''); }
                      }}
                    />
                    <button className="btn-primary" style={{ flex: 'none', width: 'auto', padding: '10px 18px' }} onClick={handleAddDay}>
                      Add day
                    </button>
                    <button className="btn-secondary" onClick={() => { setAddingDay(false); setDayLabel(''); }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="action-btn"
                    style={{ border: '1px dashed var(--border2)', borderRadius: 'var(--r)', padding: '10px 14px', width: '100%', justifyContent: 'center', color: 'var(--text2)' }}
                    onClick={() => setAddingDay(true)}
                  >
                    + Add day {(activeTrip.itinerary.at(-1)?.day ?? 0) + 1}
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} onCreate={handleCreateTrip} />}
      {addStopDay != null && <AddPlaceModal onClose={() => setAddStopDay(null)} onAdd={handleAddStop} />}
    </div>
  );
}

function NewTripModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cover, setCover] = useState(COVER_OPTIONS[0]);

  const datesInvalid = Boolean(startDate && endDate && endDate < startDate);
  const canCreate = title.trim() && !datesInvalid;
  const submit = () => canCreate && onCreate({
    title: title.trim(),
    coverEmoji: cover.emoji,
    coverBg: cover.bg,
    startDate: startDate || null,
    endDate: endDate || null,
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">New trip</div>
        <div className="modal-sub">Name it, set the dates, pick a cover — stops come next</div>
        <div className="input-group">
          <div className="input-label">Trip title</div>
          <input
            className="input-field"
            placeholder="e.g. Lisbon · Oct 2026"
            value={title}
            autoFocus
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="input-group">
            <div className="input-label">Start date</div>
            <input
              className="input-field"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={e => setStartDate(e.target.value)}
              style={{ colorScheme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' }}
            />
          </div>
          <div className="input-group">
            <div className="input-label">End date</div>
            <input
              className="input-field"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
              style={{ colorScheme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' }}
            />
          </div>
        </div>
        {datesInvalid && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: -6, marginBottom: 10 }}>
            End date is before the start date.
          </div>
        )}
        <div className="input-group">
          <div className="input-label">Cover</div>
          <div className="cat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {COVER_OPTIONS.map(c => (
              <button
                key={c.emoji}
                className={`cat-btn${cover.emoji === c.emoji ? ' selected' : ''}`}
                style={{ justifyContent: 'center', fontSize: 22, padding: '10px 0' }}
                onClick={() => setCover(c)}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!canCreate} onClick={submit}>
            Create trip
          </button>
        </div>
      </div>
    </div>
  );
}
