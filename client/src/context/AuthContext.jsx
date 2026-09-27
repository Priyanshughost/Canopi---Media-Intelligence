import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('canopi_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('canopi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('canopi_org');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate and hydrate user profile on app startup if token exists
  useEffect(() => {
    const hydrateAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setOrganization(data.organization);
          localStorage.setItem('canopi_user', JSON.stringify(data.user));
          if (data.organization) {
            localStorage.setItem('canopi_org', JSON.stringify(data.organization));
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to hydrate auth profile:', err);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    setOrganization(data.organization);
    localStorage.setItem('canopi_token', data.token);
    localStorage.setItem('canopi_user', JSON.stringify(data.user));
    if (data.organization) {
      localStorage.setItem('canopi_org', JSON.stringify(data.organization));
    }

    return data;
  };

  const signup = async (formData) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    setToken(data.token);
    setUser(data.user);
    setOrganization(data.organization);
    localStorage.setItem('canopi_token', data.token);
    localStorage.setItem('canopi_user', JSON.stringify(data.user));
    if (data.organization) {
      localStorage.setItem('canopi_org', JSON.stringify(data.organization));
    }

    return data;
  };

  const inviteTeammate = async ({ name, email, password }) => {
    const res = await fetch(`${API_URL}/api/auth/invite-teammate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to invite teammate');
    }

    return data;
  };

  const logout = () => {
    try {
      fetch(`${API_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    } catch (e) {}

    setToken(null);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('canopi_token');
    localStorage.removeItem('canopi_user');
    localStorage.removeItem('canopi_org');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        organization,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        signup,
        inviteTeammate,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
