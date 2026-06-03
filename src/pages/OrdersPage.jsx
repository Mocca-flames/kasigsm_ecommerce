import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  const fetchOrderDetail = async (orderId) => {
    try {
      const data = await api.getOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      setError(err.message);
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
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-meta">
                <span>{formatDate(order.created_at)}</span>
                <span className="order-total">{formatPrice(order.total_amount, order.currency)}</span>
              </div>
              
              <button 
                onClick={() => selectedOrder?.id === order.id ? setSelectedOrder(null) : fetchOrderDetail(order.id)}
                className="btn-text"
              >
                {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
              </button>
              
              {selectedOrder?.id === order.id && (
                <div className="order-items">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <span>Item ID: {item.item_id}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>{formatPrice(item.unit_price, order.currency)}</span>
                      
                      {item.credentials && item.credentials.length > 0 && (
                        <div className="credentials">
                          <h4>Your Credentials:</h4>
                          {item.credentials.map((cred) => (
                            <div key={cred.id} className="credential">
                              <code>{cred.payload}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
