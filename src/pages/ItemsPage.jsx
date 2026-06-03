import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemType, setItemType] = useState('');
  const [category, setCategory] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems(itemType || null, category || null);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [itemType, category]);

  const formatPrice = (price, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(price);
  };

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="items-page">
      <header className="page-header">
        <h1>Our Services & Products</h1>
        <Link to="/cart" className="cart-link">View Cart</Link>
      </header>

      <div className="filters">
        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="">All Types</option>
          <option value="SERVICE">Services</option>
          <option value="PRODUCT">Products</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="INTERNET">Internet</option>
          <option value="VOICE">Voice</option>
          <option value="DATA">Data</option>
        </select>
      </div>

      <div className="items-grid">
        {items.length === 0 ? (
          <p className="no-items">No items available</p>
        ) : (
          items.map((item) => (
            <Link to={`/items/${item.slug}`} key={item.id} className="item-card">
              {item.thumbnail && (
                <img src={item.thumbnail} alt={item.title} className="item-thumbnail" />
              )}
              <div className="item-info">
                <span className="item-type">{item.item_type}</span>
                <h3>{item.title}</h3>
                <p className="item-description">{item.description}</p>
                <p className="item-price">{formatPrice(item.price_final, item.currency)}</p>
                {item.stock !== null && item.stock > 0 && (
                  <span className="item-stock">{item.stock} in stock</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
