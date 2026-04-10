import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { TRIPS } from '../../data';

const catColor = {
  food: '#2a1a0e',
  nature: '#0a1a0a',
  culture: '#0a0a1a',
  shopping: '#1a0a1a',
  nightlife: '#050510',
  wellness: '#0a1a0a',
};

export default function TripsPage() {
  const { user } = useAuth();
  // TODO: replace with Supabase query: select * from trips where user_id = user.id
  const myTrips = user ? TRIPS.filter(t => t.user_id === user.id) : [];
  const [activeTrip, setActiveTrip] = useState(myTrips[0] ?? null);
  const { showToast } = useToast();

  const handleShare = (name) => showToast(`Sharing "${name}"...`);

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
              onClick={() => setActiveTrip(trip)}
            >
              <div className="trip-cover" style={{ background: trip.coverBg }}>
                <span style={{ fontSize: 52 }}>{trip.coverEmoji}</span>
              </div>
              <div className="trip-info">
                <div className="trip-title">{trip.title}</div>
                <div className="trip-meta">
                  <span>{trip.days} days</span>
                  <span>·</span>
                  <span>{trip.stops} stops</span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent2)' }}>Shared with {trip.sharedWith}</span>
                </div>
              </div>
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: 4 }}>+ New trip</button>
        </div>

        <div className="trips-right">
          {activeTrip && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div className="section-heading">{activeTrip.title}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text2)' }}>
                    <span>{activeTrip.days} days</span>
                    <span>·</span>
                    <span>{activeTrip.stops} stops</span>
                  </div>
                </div>
                <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px', borderRadius: 'var(--r)' }} onClick={() => handleShare(activeTrip.title)}>
                  ↑ Share trip
                </button>
              </div>

              <div className="share-section">
                <div className="share-title">Share "{activeTrip.title}"</div>
                <div className="share-link">wandr.app/you/{activeTrip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} →</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <button className="share-btn" onClick={() => handleShare('Sent to friends!')}>📲 Send to Wandr friends</button>
                  <button className="share-btn" onClick={() => handleShare('Copied Instagram story!')}>📸 Instagram story</button>
                  <button className="share-btn" onClick={() => handleShare('Link copied!')}>🔗 Copy link</button>
                  <button className="share-btn" onClick={() => handleShare('Shared to WhatsApp!')}>💬 WhatsApp / iMessage</button>
                </div>
                <div className="export-row">
                  <button className="export-btn">🗺 Map view</button>
                  <button className="export-btn">📋 List</button>
                  <button className="export-btn">📖 Story</button>
                  <button className="export-btn">📄 PDF</button>
                </div>
              </div>

              {activeTrip.itinerary.map(day => (
                <div className="day-block" key={day.day}>
                  <div className="day-header">Day {day.day} — {day.label}</div>
                  {day.stops.map(stop => (
                    <div className="stop-row" key={stop.name}>
                      <div className="stop-icon" style={{ background: catColor[stop.category] || '#111' }}>{stop.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div className="stop-name">{stop.name}</div>
                        <div className="stop-detail">{stop.category.charAt(0).toUpperCase() + stop.category.slice(1)} · {stop.time}</div>
                        <div className="stop-stars">{'★'.repeat(stop.rating)}{'☆'.repeat(5 - stop.rating)}</div>
                        <div className="stop-tip">"{stop.tip}"</div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>⋯</button>
                    </div>
                  ))}
                  <button className="action-btn" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r)', padding: '8px 14px', width: '100%', justifyContent: 'center', color: 'var(--text3)' }}>
                    + Add stop to day {day.day}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
