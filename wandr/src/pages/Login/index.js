import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { signUpWithGoogle, signInWithGoogle, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignUpWithGoogle = async () => {
    await signUpWithGoogle();
    navigate('/onboarding');
  };

  const handleSignInWithGoogle = async () => {
    await signInWithGoogle();
    navigate('/');
  };

  const handleSignInWithEmail = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">W</div>

      {/* Sign Up */}
      <div className="auth-card" style={{ marginBottom: 16 }}>
        <div className="auth-title">New to Wandr?</div>
        <div className="auth-sub">Create an account and start sharing the places you love.</div>
        <button className="btn-google" onClick={handleSignUpWithGoogle}>
          <span className="btn-google-icon">G</span>
          Sign up with Google
        </button>
      </div>

      <div className="auth-divider">or sign in to your account</div>

      {/* Sign In */}
      <div className="auth-card">
        <div className="auth-title">Welcome back</div>
        <form onSubmit={handleSignInWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div className="input-label">Email</div>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div className="input-label">Password</div>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
          <button className="btn-primary" type="submit" style={{ marginTop: 4 }}>Sign in</button>
        </form>

        <div className="auth-or">
          <span>or</span>
        </div>

        <button className="btn-google" onClick={handleSignInWithGoogle} style={{ marginTop: 12 }}>
          <span className="btn-google-icon">G</span>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
