import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        setError('Missing payment reference');
        setLoading(false);
        return;
      }
      try {
        const data = await api.getPaymentVerify(reference);
        setStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [reference]);

  if (loading) return <div className="loading">Verifying payment...</div>;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Payment Status</h1>
        {error ? (
          <div className="error">
            <p>{error}</p>
            <Link to="/orders" className="btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>
              Back to Orders
            </Link>
          </div>
        ) : (
          <div>
            {status?.status === 'success' ? (
              <p className="promo-msg valid">Payment Successful</p>
            ) : (
              <div className="error">
                <p>Payment failed or is pending.</p>
                {status && <pre>{JSON.stringify(status, null, 2)}</pre>}
              </div>
            )}
            <Link to="/orders" className="btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>
              Back to Orders
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
