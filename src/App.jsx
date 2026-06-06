import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">KasI GSM</Link>
      <div className="nav-links">
        <Link to="/">Browse</Link>
        <Link to="/services">Services</Link>
        <Link to="/products">Products</Link>
        {user ? (
          <>
            <Link to="/orders">Orders</Link>
            <Link to="/wallet">Wallet</Link>
            <Link to="/cart">Cart ({cartCount})</Link>
            <button onClick={logout} className="btn-text">Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <NavBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ItemsPage />} />
              <Route path="/services" element={<ItemsPage initialCategory="REMOTE" />} />
              <Route path="/services/remote" element={<Navigate to="/services" replace />} />
              <Route path="/services/rental" element={<Navigate to="/" replace />} />
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
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
