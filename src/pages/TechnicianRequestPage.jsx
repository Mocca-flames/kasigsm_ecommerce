import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TechnicianRequestPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.requestTechnician({ name, phone, issue });
      setSuccess('Technician request submitted successfully');
      setName('');
      setPhone('');
      setIssue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="terminal-zone">
        <div className="auth-page">
          <div className="auth-card">
            <h1>Technician Request</h1>
            <p className="error">Please log in to submit a request.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-zone">
      <div className="auth-page">
        <div className="auth-card">
          <h1>Technician Request</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Issue</label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                required
                rows={4}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
          {success && <div className="promo-msg valid" style={{ marginTop: 12 }}>{success}</div>}
        </div>
      </div>
    </div>
  );
}
