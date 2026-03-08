import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL;

if (!API) {
  console.error(
    '[C.O.R.E.] REACT_APP_API_URL is not set. ' +
    'Create client/.env.production with REACT_APP_API_URL=https://core-cmms-production-2be6.up.railway.app'
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('core_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) return Promise.reject(new Error(`Verify failed: ${r.status}`));
        return r.json();
      })
      .then(data => {
        setUser(data.user);
      })
      .catch(err => {
        console.warn('[C.O.R.E.] Token verification failed:', err.message);
        localStorage.removeItem('core_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    if (!API) {
      throw new Error(
        'API URL is not configured. REACT_APP_API_URL is missing from the build.'
      );
    }

    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned non-JSON response (status ${res.status}). Check CORS and API URL.`);
    }

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
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
