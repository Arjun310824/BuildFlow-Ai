import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'buildflow_auth_user';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read initial user state safely from localStorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && parsed.email) {
        return parsed;
      }
      // If corrupted or invalid, clear it
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch (err) {
      console.warn('Failed to parse auth user from localStorage:', err);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      return null;
    }
  });

  const isAuthenticated = Boolean(user);

  /**
   * Log in user with credentials or default demo profile
   * @param {Object} credentials - { email, password, name, role }
   */
  const login = useCallback(async (credentials = {}) => {
    const email = (credentials.email || 'alex.morgan@buildflow.ai').trim();
    const name = credentials.name || (email === 'alex.morgan@buildflow.ai' ? 'Alex Morgan' : email.split('@')[0]);
    const role = credentials.role || 'Project Director';
    const avatar = credentials.avatar || name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM';

    const userData = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role,
      avatar,
      loginAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (err) {
      console.warn('Failed to persist auth user to localStorage:', err);
    }

    setUser(userData);
    return userData;
  }, []);

  /**
   * Log out user, purge storage, and clear cookies
   */
  const logout = useCallback(() => {
    // 1. Clear in-memory user state
    setUser(null);

    // 2. Remove localStorage items
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('buildflow_token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
    } catch (err) {
      console.warn('Failed to clear localStorage on logout:', err);
    }

    // 3. Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (err) {
      console.warn('Failed to clear sessionStorage on logout:', err);
    }

    // 4. Clear any auth cookies if present
    try {
      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        if (name.toLowerCase().includes('token') || name.toLowerCase().includes('auth') || name.toLowerCase().includes('session')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    } catch (err) {
      console.warn('Failed to clear cookies on logout:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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

export default AuthContext;
