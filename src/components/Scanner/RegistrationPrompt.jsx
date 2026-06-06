import { useState } from 'react';
import { api } from '../../services/api';

export default function RegistrationPrompt({ onSaved }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setErr(null);
    setMsg(null);
    try {
      await api.register(email.trim(), generateTempPassword());
      setMsg('Saved. We will email you when a new tool supports your device.');
      onSaved?.();
    } catch (e2) {
      setErr(e2.message || 'Could not save right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="soft-registration" onSubmit={handle}>
      <div className="soft-registration__text">
        Save these results — get notified when new tools support your device.
      </div>
      <div className="soft-registration__form">
        <input
          type="email"
          placeholder="you@workshop.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
        />
        <button type="submit" disabled={submitting || !email.trim()}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
      {msg ? <div className="soft-registration__msg">{msg}</div> : null}
      {err ? <div className="soft-registration__msg" style={{ color: 'var(--color-warning)' }}>{err}</div> : null}
    </form>
  );
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-10) + 'A1!';
}
