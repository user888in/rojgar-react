import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(null); // prevents concurrent refresh calls

  // Initialize auth state
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call server-side logout to clear session cookies
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {}); // Ignore errors
    } catch (error) {
      // Silently ignore logout API errors
    }

    // Clear local storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const updateUser = useCallback((partialUser) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback((roles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Refresh access token using cookie-based refresh token
  const refreshAccessToken = useCallback(async () => {
    if (refreshingRef.current) return refreshingRef.current;
    refreshingRef.current = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return false;
        // If the server returns a new token, save it
        const data = await res.json().catch(() => null);
        if (data?.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
        }
        return true;
      } catch {
        return false;
      } finally {
        refreshingRef.current = null;
      }
    })();
    return refreshingRef.current;
  }, []);

  // Fetch wrapper with automatic token refresh on 401/403
  const authFetch = useCallback(async (url, options = {}) => {
    options.credentials = 'include';
    const isFormData = options.body instanceof FormData;
    options.headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(url, options);
    } catch (err) {
      throw err;
    }

    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Re-read token after refresh in case it changed
        const currentToken = localStorage.getItem(TOKEN_KEY);
        if (currentToken) {
          options.headers['Authorization'] = `Bearer ${currentToken}`;
        }
        try {
          res = await fetch(url, options);
        } catch (err) {
          throw err;
        }
        if (res.status === 401 || res.status === 403) {
          // Still unauthorized after refresh — force logout
          await logout();
        }
      }
    }
    return res;
  }, [token, refreshAccessToken, logout]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    hasRole,
    getAuthHeaders,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
