import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_e) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData = {}) => {
    const data = userData.id && userData.role
      ? userData
      : { email: userData.email };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const refreshUser = (data) => {
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
