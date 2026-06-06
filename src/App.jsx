import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WalletPage from './pages/WalletPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TechnicianRequestPage from './pages/TechnicianRequestPage';
import ComingSoonPage from './pages/ComingSoonPage';
import './App.css';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

function NavBar() {
  const { user, logout } = useAuth();
  const cartCount = JSON.parse(localStorage.getItem('cart') || '[]').length;
  const location = useLocation();
  const isHome = location.pathname === '/';
  const onDark = isHome;

  return (
    <nav className={`navbar${onDark ? ' navbar--dark' : ''}`}>
      <Link to="/" className="nav-logo">
        <span className="logo-accent">Kasi</span>
        <span className="logo-main">GSM</span>
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="cart-link">Register</Link>
          </>
        ) : (
          <>
            <Link to="/orders">Orders</Link>
            <Link to="/wallet">Wallet</Link>
            <Link to="/cart" className="cart-link">Cart ({cartCount})</Link>
            <button onClick={logout} className="btn-text">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function MainContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <main className={`main-content${isHome ? ' main-content--home' : ''}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ItemsPage initialCategory="REMOTE" />} />
        <Route path="/services/remote" element={<Navigate to="/services" replace />} />
        <Route path="/services/rental" element={<Navigate to="/services" replace />} />
        <Route path="/products" element={<ComingSoonPage />} />
        <Route path="/items/:slug" element={<ItemDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
        <Route path="/technician/request" element={<RequireAuth><TechnicianRequestPage /></RequireAuth>} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <NavBar />
          <MainContent />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
