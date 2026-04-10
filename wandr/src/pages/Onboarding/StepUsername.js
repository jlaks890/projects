export default function StepUsername({ data, onChange }) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-emoji">✈️</div>
      <div className="onboarding-title">What should we call you?</div>
      <div className="onboarding-sub">This is how your friends will find you on Wandr</div>
      <div className="input-group">
        <div className="input-label">Display name</div>
        <input
          className="input-field"
          placeholder="e.g. Maya K."
          value={data.name}
          onChange={e => onChange({ name: e.target.value })}
        />
      </div>
      <div className="input-group">
        <div className="input-label">Username</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>@</span>
          <input
            className="input-field"
            style={{ paddingLeft: 28 }}
            placeholder="explorer"
            value={data.username}
            onChange={e => onChange({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
          />
        </div>
      </div>
    </div>
  );
}
