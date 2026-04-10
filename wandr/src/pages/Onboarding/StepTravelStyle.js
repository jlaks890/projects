import { CATEGORIES } from '../../data';

export default function StepTravelStyle({ data, onChange }) {
  const toggle = (id) => {
    const selected = data.travelStyle.includes(id)
      ? data.travelStyle.filter(s => s !== id)
      : [...data.travelStyle, id];
    onChange({ travelStyle: selected });
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-emoji">🗺️</div>
      <div className="onboarding-title">What kind of traveler are you?</div>
      <div className="onboarding-sub">Pick everything that fits — we'll personalize your feed</div>
      <div className="cat-grid" style={{ marginTop: 8 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`cat-btn${data.travelStyle.includes(c.id) ? ' selected' : ''}`}
            style={{ padding: '14px 10px', flexDirection: 'column', gap: 8, height: 'auto' }}
            onClick={() => toggle(c.id)}
          >
            <span style={{ fontSize: 28 }}>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
