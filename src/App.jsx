import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import './App.css';

function NavBar() {
  const { user, logout } = useAuth();
  const cartCount = JSON.parse(localStorage.getItem('cart') || '[]').length;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">KasI GSM</Link>
      <div className="nav-links">
        <Link to="/">Browse</Link>
        {user ? (
          <>
            <Link to="/orders">Orders</Link>
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
              <Route path="/items/:slug" element={<ItemDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
