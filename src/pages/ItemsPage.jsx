import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(price);
};

export default function ItemsPage({ initialCategory }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemType, setItemType] = useState('');
  const [search, setSearch] = useState('');
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 24;
  const [category, setCategory] = useState(() => {
    if (initialCategory === 'REMOTE') return 'REMOTE';
    if (initialCategory === 'TOOL') return 'TOOL';
    return '';
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (initialCategory === 'REMOTE') return 'remote';
    if (initialCategory === 'TOOL') return 'rental';
    return 'all';
  });

  const prevCategory = useRef(initialCategory);
  useEffect(() => {
    if (prevCategory.current !== initialCategory) {
      prevCategory.current = initialCategory;
      if (initialCategory === 'REMOTE') {
        setCategory('REMOTE');
        setActiveTab('remote');
      } else if (initialCategory === 'TOOL') {
        setCategory('TOOL');
        setActiveTab('rental');
      } else {
        setCategory('');
        setActiveTab('all');
      }
      setItemType('');
      setPage(1);
    }
  }, [initialCategory]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getItems(itemType || null, category || null, search || null, page, limit);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemType, category, search, page]);

  const fetchBanners = async () => {
    try {
      const data = await api.getBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'remote') {
      setCategory('REMOTE');
    } else if (tab === 'rental') {
      setCategory('TOOL');
    } else {
      setCategory('');
    }
    setItemType('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="items-page">
      <header className="page-header">
        <h1>Our Services</h1>
        <Link to="/cart" className="cart-link">View Cart</Link>
      </header>

      {!loadingBanners && banners.length > 0 && (
        <div style={{ position: 'relative', width: '100%', maxHeight: 240, overflow: 'hidden', marginBottom: 16, borderRadius: 6 }}>
          <img src={banners[currentBanner].image_url} alt={`Banner ${currentBanner + 1}`} style={{ width: '100%', height: 240, objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {banners.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentBanner(idx)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: idx === currentBanner ? 'var(--green-bright)' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="category-tabs">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => switchTab('all')}>All</button>
        <button className={`tab-btn ${activeTab === 'remote' ? 'active' : ''}`} onClick={() => switchTab('remote')}>Remote Services</button>
        <button className={`tab-btn ${activeTab === 'rental' ? 'active' : ''}`} onClick={() => switchTab('rental')}>Tool Rental</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select value={itemType} onChange={(e) => { setItemType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="SERVICE">Services</option>
        </select>
      </div>

      <div className="items-grid">
        {items.length === 0 ? (
          <p className="no-items">No items available</p>
        ) : (
          items.map((item) => (
            <Link to={`/items/${item.slug}`} key={item.id} className="ecom-card">
              <div className="card-titlebar">
                <span className="type-badge">{item.category || 'Service'}</span>
                <div className="dots">
                  <span className="dot active" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
              <div className="thumb-wrap">
                {item.media_url && (
                  <img src={item.media_url} alt={item.meta?.display_title || item.title} />
                )}
              </div>
               <div className="card-body">
                 <div className="card-title">{item.meta?.display_title || item.title}</div>
                 <div className="desc">{item.description}</div>
                <div className="meta-row">
                   <div className="price">{formatPrice(item.price_final)}</div>
                <div className="meta">
                  {item.delivery_time && <span className="meta-del">⏱ {item.delivery_time}</span>}
                  {item.meta?.rent_duration && <span className="meta-dur">{item.meta.rent_duration}</span>}
                </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
