import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('core_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => { localStorage.removeItem('core_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('core_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('core_token');
    setToken(null);
    setUser(null);
  };

  const authFetch = (url, options = {}) => {
    return fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
