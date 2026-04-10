import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StepUsername from './StepUsername';
import StepTravelStyle from './StepTravelStyle';
import StepFollowFriends from './StepFollowFriends';

const STEPS = ['username', 'travelStyle', 'followFriends'];

const STEP_LABELS = ['Your identity', 'Travel style', 'Find friends'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    username: '',
    travelStyle: [],
    following: [],
  });

  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  const canAdvance = () => {
    if (step === 0) return data.name.trim() && data.username.trim();
    if (step === 1) return data.travelStyle.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      completeOnboarding(data);
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card onboarding-card">
        {/* Progress bar */}
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-progress-step${i <= step ? ' active' : ''}`}
            />
          ))}
        </div>
        <div className="onboarding-step-label">{STEP_LABELS[step]}</div>

        {step === 0 && <StepUsername data={data} onChange={update} />}
        {step === 1 && <StepTravelStyle data={data} onChange={update} />}
        {step === 2 && <StepFollowFriends data={data} onChange={update} />}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          <button
            className="btn-primary"
            style={{ flex: 2 }}
            onClick={handleNext}
            disabled={!canAdvance()}
          >
            {step === STEPS.length - 1 ? 'Start exploring →' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
