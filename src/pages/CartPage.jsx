import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoValid, setPromoValid] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promoValid ? discountAmount || subtotal * 0.1 : 0;
  const total = Math.max(0, subtotal - discount);

  const applyPromo = async () => {
    if (!promoCode) return;
    setLoading(true);
    setPromoMessage('');
    try {
      const data = await api.validatePromoCode(promoCode, subtotal);
      setPromoValid(data.valid);
      setAppliedPromo(data);
      setDiscountAmount(data.discount_amount || subtotal * 0.1);
      setPromoMessage(data.message || 'Promo applied');
    } catch (err) {
      setPromoValid(false);
      setPromoMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = await api.createOrder(
        cart.map((item) => ({ item_id: item.item_id, quantity: item.quantity })),
        appliedPromo?.promo_code
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
      
      <table className="cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td className="item-title">{item.title}</td>
              <td className="item-price">{formatPrice(item.price, item.currency)}</td>
              <td>
                <div className="qty-ctrl">
                  <button onClick={() => updateQuantity(index, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                </div>
              </td>
              <td>{formatPrice(item.price * item.quantity, item.currency)}</td>
              <td>
                <button onClick={() => removeItem(index)} className="btn-remove">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="promo-bar">
        <input
          type="text"
          placeholder="Promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />
        <button onClick={applyPromo} disabled={loading}>Apply</button>
      </div>
      {promoMessage && (
        <div className={`promo-msg ${promoValid ? 'valid' : 'invalid'}`}>{promoMessage}</div>
      )}
      
      <div className="cart-totals">
        <div className="line">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {promoValid && (
          <div className="line discount-line">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="line total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <button onClick={checkout} disabled={loading} className="btn-checkout">
          {loading ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
}
