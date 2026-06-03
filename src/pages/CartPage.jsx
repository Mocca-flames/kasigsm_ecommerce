import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const formatPrice = (price, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQty;
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = await api.createOrder(
        cart.map((item) => ({ item_id: item.item_id, quantity: item.quantity }))
      );
      
      const paymentData = await api.initiatePayment(orderData.id);
      
      localStorage.removeItem('cart');
      setCart([]);
      
      window.location.href = paymentData.authorization_url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <p className="empty-cart">Your cart is empty</p>
        <Link to="/" className="btn-primary">Browse Items</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="cart-items">
        {cart.map((item, index) => (
          <div key={index} className="cart-item">
            <div className="item-details">
              <h3>{item.title}</h3>
              <p className="item-price">{formatPrice(item.price, item.currency)}</p>
            </div>
            
            <div className="quantity-controls">
              <button onClick={() => updateQuantity(index, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
            </div>
            
            <p className="item-total">{formatPrice(item.price * item.quantity, item.currency)}</p>
            
            <button onClick={() => removeItem(index)} className="btn-remove">Remove</button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <h2>Total: {formatPrice(total)}</h2>
        <button onClick={checkout} disabled={loading} className="btn-primary btn-checkout">
          {loading ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
}
