import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Verify Email</h1>
          <p className="error">Email parameter is missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify Email</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
