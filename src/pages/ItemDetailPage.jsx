import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ItemDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await api.getItem(slug);
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [slug]);

  const formatPrice = (price, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((c) => c.item_id === item.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ item_id: item.id, title: item.title, price: item.price_final, quantity, currency: item.currency });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!item) return <div className="error">Item not found</div>;

  return (
    <div className="detail-terminal">
      <Link to="/" className="back-link">&larr; Back to Items</Link>
      <div className="detail-inner">
        {item.media_url && (
          <img src={item.media_url} alt={item.title} className="detail-img" />
        )}
        <div className="detail-content">
          <span className="item-type">{item.item_type}</span>
          <h1>{item.title}</h1>
          <p className="description">{item.description}</p>
          <div className="price-section">
            <span className="detail-price">{formatPrice(item.price_final, item.currency)}</span>
          </div>
          {item.delivery_time && (
            <div className="detail-meta">
              <span>Delivery: {item.delivery_time}</span>
            </div>
          )}
          {item.item_type === 'PRODUCT' && item.stock !== null && (
            <div className="stock-info">
              {item.stock > 0 ? (
                <span className="in-stock">{item.stock} available in stock</span>
              ) : (
                <span className="out-of-stock">Out of stock</span>
              )}
            </div>
          )}
          {user && item.stock !== 0 && (
            <div className="add-to-cart-section">
              <input
                type="number"
                min="1"
                max={item.stock || 999}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <button onClick={addToCart} className="btn-primary">
                Add to Cart
              </button>
            </div>
          )}
          {!user && (
            <p className="login-prompt">
              <Link to="/login">Log in</Link> to purchase
            </p>
          )}
        </div>
      </div>
      {item.provider_listings && item.provider_listings.length > 0 && (
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border-dim)', paddingTop: 16 }}>
          <h3 className="type-sub">Provider Listings</h3>
          <table className="provider-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Cost</th>
                <th>Preferred</th>
              </tr>
            </thead>
            <tbody>
              {item.provider_listings.map((listing, idx) => (
                <tr key={idx}>
                  <td>{listing.provider_name}</td>
                  <td>{formatPrice(listing.cost, item.currency)}</td>
                  <td>{listing.preferred ? <span className="preferred">✔</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
