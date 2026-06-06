import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.resendOtp(email);
      setResent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

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
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </p>
        {resent && <p style={{ color: 'green', textAlign: 'center' }}>OTP has been resent. Please check your inbox.</p>}
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
