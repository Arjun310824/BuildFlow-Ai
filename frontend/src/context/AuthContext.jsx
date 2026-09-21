import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../services/api';

const TOKEN_KEY = 'buildops_token';
const USER_KEY = 'buildflow_auth_user';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed && typeof parsed === 'object' && parsed.email ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  // Loading state while verifying token on startup
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user && token);

  /**
   * Safe helper to compute avatar initials
   */
  const getAvatarInitials = (name) => {
    if (!name) return 'BO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  /**
   * Log out user, purge storage, and reset state
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('buildflow_token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      sessionStorage.clear();
    } catch (err) {
      console.warn('[AuthContext] Failed to clear storage on logout:', err);
    }
  }, []);

  /**
   * Verify token on startup using GET /api/auth/me
   */
  useEffect(() => {
    let isMounted = true;

    const verifyExistingAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getMeApi();
        if (isMounted) {
          if (response && response.success && response.user) {
            const verifiedUser = {
              ...response.user,
              avatar: getAvatarInitials(response.user.name),
            };
            setUser(verifiedUser);
            setToken(storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
          } else {
            logout();
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Token verification failed:', err.message);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyExistingAuth();

    // Listen for unauthorized 401 events dispatched by apiClient
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('buildops:auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('buildops:auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  /**
   * Log in user with email & password via backend API
   * @param {Object} credentials - { email, password }
   */
  const login = useCallback(async (credentials = {}) => {
    const { email, password } = credentials;

    const response = await loginApi({
      email: (email || '').trim(),
      password,
    });

    if (!response || !response.success || !response.token) {
      throw new Error(response?.message || 'Login failed. Please verify your credentials.');
    }

    const authUser = {
      ...response.user,
      avatar: getAvatarInitials(response.user?.name),
      loginAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    } catch (err) {
      console.warn('[AuthContext] Failed to persist auth to localStorage:', err);
    }

    setToken(response.token);
    setUser(authUser);
    return authUser;
  }, []);

  /**
   * Register a new user via backend API
   * @param {Object} userData - { name, email, password, role }
   */
  const register = useCallback(async (userData = {}) => {
    const response = await registerApi(userData);

    if (!response || !response.success || !response.token) {
      throw new Error(response?.message || 'Registration failed.');
    }

    const authUser = {
      ...response.user,
      avatar: getAvatarInitials(response.user?.name),
      loginAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    } catch (err) {
      console.warn('[AuthContext] Failed to persist auth to localStorage:', err);
    }

    setToken(response.token);
    setUser(authUser);
    return authUser;
  }, []);

  /**
   * Update current user profile fields in memory and localStorage
   * @param {Object} updates - Fields to update (e.g. { role, name, email })
   */
  const updateUser = useCallback((updates = {}) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (updates.name) {
        updated.avatar = getAvatarInitials(updates.name);
      }
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('[AuthContext] Failed to persist updated user:', err);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
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

export default AuthContext;
