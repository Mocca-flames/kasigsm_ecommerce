import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithWallet = async (orderId) => {
    setPayingId(orderId);
    try {
      const result = await api.payWithWallet(orderId);
      alert(`Payment successful! Wallet balance: ${formatPrice(result.wallet_balance)}`);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayingId(null);
    }
  };

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

  const getStatusClass = (status) => {
    const statusMap = {
      PENDING: 'status-pending',
      PAID: 'status-paid',
      FULFILLED: 'status-fulfilled',
      CANCELLED: 'status-cancelled',
    };
    return statusMap[status] || '';
  };

  if (!user) {
    return (
      <div className="orders-page">
        <h1>Order History</h1>
        <p>Please <Link to="/login">login</Link> to view your orders</p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="orders-page">
      <h1>Order History</h1>

      {orders.length === 0 ? (
        <p className="no-orders">No orders yet</p>
      ) : (
        <div className="orders-container">
          {orders.map((order) => (
            <Link to={`/orders/${order.id}`} key={order.id} className="order-ticket">
              <div className="order-ticket-header">
                <span className="id">Order #{order.id.slice(0, 8)}</span>
                <span className={`order-status ${getStatusClass(order.status)}`}>{order.status}</span>
              </div>
              <div className="order-ticket-body">
                <div className="order-meta-line">
                  <span>{formatDate(order.created_at)}</span>
                  <span className="val">{formatPrice(order.total_amount, order.currency)}</span>
                </div>
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span className="name">{item.title || item.item_id}</span>
                    <span className="amt">{formatPrice(item.unit_price, order.currency)}</span>
                  </div>
                ))}
                {order.status === 'PENDING' && user.role !== 'ADMIN' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-secondary" onClick={(e) => { e.preventDefault(); }}>
                      Pay with Card
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePayWithWallet(order.id);
                      }}
                      disabled={payingId === order.id}
                    >
                      {payingId === order.id ? 'Processing...' : 'Pay with Wallet'}
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
