import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const [walletData, txData] = await Promise.all([
          api.getWalletMe(),
          api.getWalletTransactions(),
        ]);
        setWallet(walletData);
        setTransactions(txData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const formatPrice = (price, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setTopUpError('');
    setTopUpSuccess('');
    setTopUpLoading(true);

    const numAmount = Number(amount);
    if (numAmount < 100) { setTopUpError('Minimum top-up is R100'); setTopUpLoading(false); return; }
    if (numAmount > 5000) { setTopUpError('Maximum top-up is R5,000'); setTopUpLoading(false); return; }
    if (numAmount % 100 !== 0) { setTopUpError('Amount must be a multiple of R100'); setTopUpLoading(false); return; }

    try {
      await api.topUpWallet(numAmount);
      setTopUpSuccess('Top-up request submitted. Admin will review shortly.');
      const txData = await api.getWalletTransactions();
      setTransactions(txData);
      setAmount('');
    } catch (err) {
      setTopUpError(err.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const isCredit = (type) => ['TOPUP', 'ADMIN_CREDIT', 'REFUND'].includes(type);
  const getTxAmount = (tx) => (isCredit(tx.type) ? `+${formatPrice(tx.amount)}` : `-${formatPrice(tx.amount)}`);

  if (!user) {
    return (
      <div className="wallet-panel">
        <div className="wallet-status-card">
          <p>Please log in to view your wallet.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading wallet...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="wallet-panel">
      <div className="wallet-status-card">
        <div className="lbl">Balance</div>
        <div className="balance">{formatPrice(wallet?.balance)}</div>
        {wallet?.is_low_balance && (
          <div className="low">Low balance — top up recommended</div>
        )}
        {wallet?.status && (
          <div className={`wallet-status ${wallet.status.toLowerCase()}`}>
            Status: {wallet.status}
          </div>
        )}
        {wallet?.client_ref && (
          <div className="wallet-client-ref">Ref: {wallet.client_ref}</div>
        )}
        <form onSubmit={handleTopUp} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Top Up Amount (R100 – R5,000, multiples of R100)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max="5000"
              step="100"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={topUpLoading}>
            {topUpLoading ? 'Processing...' : 'Top Up'}
          </button>
          {topUpError && <div className="error" style={{ marginTop: 8 }}>{topUpError}</div>}
          {topUpSuccess && <div className="promo-msg valid" style={{ marginTop: 8 }}>{topUpSuccess}</div>}
        </form>
      </div>

      <div>
        <h3 className="type-sub" style={{ marginBottom: 12 }}>Transactions</h3>
        <table className="wallet-tx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ color: 'var(--text-muted)' }}>No transactions</td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx.id || idx}>
                  <td>{formatDate(tx.created_at)}</td>
                  <td>{tx.description || tx.type}</td>
                  <td className={isCredit(tx.type) ? 'credit' : 'debit'}>
                    {getTxAmount(tx)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
