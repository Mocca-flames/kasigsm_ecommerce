import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(id);
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!order) return <div className="error">Order not found</div>;

  return (
    <div className="orders-page">
      <Link to="/orders" className="back-link">&larr; Back to Orders</Link>
      <h1>Order #{order.id.slice(0, 8)}</h1>

      <div className="order-ticket">
        <div className="order-ticket-header">
          <span className="id">Order #{order.id.slice(0, 8)}</span>
          <span className={`order-status ${getStatusClass(order.status)}`}>{order.status}</span>
        </div>
        <div className="order-ticket-body">
          <div className="order-meta-line">
            <span>Placed: {formatDate(order.created_at)}</span>
            <span className="val">{formatPrice(order.total_amount)}</span>
          </div>
          {order.updated_at && (
            <div className="order-meta-line">
              <span>Updated: {formatDate(order.updated_at)}</span>
            </div>
          )}

          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="order-item">
              <span className="name">{item.title || item.item_id}</span>
                  <span>{formatPrice(item.unit_price)} × {item.quantity}</span>
                  <span className="amt">{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}

          {order.items && order.items.some((item) => item.credentials && item.credentials.length > 0) && (
            <div className="credentials-block">
              <h4>Your Credentials</h4>
              {order.items.flatMap((item) => item.credentials || []).map((cred, idx) => (
                <pre key={cred.id || idx}>{JSON.stringify(cred, null, 2)}</pre>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
