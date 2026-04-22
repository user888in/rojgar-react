# JWT Authentication & API Calls - React Best Practices

## Issues Found & Fixed

### 1. **Missing Auth Initialization State**
**Problem:** AuthContext didn't track when auth was ready, causing uncertain timing.

**Solution:** Added `isAuthReady` state that marks when localStorage has been synced.

```javascript
const [isAuthReady, setIsAuthReady] = useState(!!getStoredToken());

useEffect(() => {
  setIsAuthReady(true); // Mark ready after mount (localStorage is synchronous)
}, []);
```

---

### 2. **Missing Dependency in useEffect**
**Problem:** `getAuthHeaders()` was called inside useEffect but not in dependency array. This violates React's exhaustive dependencies rule and can cause stale closures.

**Solution:** Added `getAuthHeaders` to the dependency array.

```javascript
// ❌ BEFORE
useEffect(() => {
  // ... calls getAuthHeaders() inside
}, [token]); // Missing getAuthHeaders!

// ✅ AFTER
useEffect(() => {
  // ... calls getAuthHeaders() inside
}, [token, getAuthHeaders]); // Both dependencies included
```

---

### 3. **Better Token Availability Check**
**Problem:** No visibility into whether token is truly unavailable or still loading.

**Solution:** Used `isAuthReady` to differentiate between "not loaded yet" and "no token available".

```javascript
// Component usage:
const { token, isAuthReady, getAuthHeaders } = useAuth();

useEffect(() => {
  if (!isAuthReady) {
    console.debug('Auth still initializing...');
    return;
  }
  if (!token) {
    console.debug('User not authenticated');
    return;
  }
  // Safe to call API here
}, [token, isAuthReady]);
```

---

## JWT Auth Best Practices

### ✅ Best Practices for API Calls with Auth

#### 1. **Create a Custom Hook for Authenticated Fetch**
Instead of duplicating the fetch logic everywhere, create a helper hook:

```javascript
// hooks/useAuthenticatedFetch.js
import { useAuth } from '../context/AuthContext';

export const useAuthenticatedFetch = () => {
  const { getAuthHeaders, token } = useAuth();

  const fetchWithAuth = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Handle token expiration
      throw new Error('Token expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  return { fetchWithAuth, token };
};
```

**Usage:**
```javascript
const { fetchWithAuth, token } = useAuthenticatedFetch();

useEffect(() => {
  if (!token) return;

  const loadData = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/data`);
      setData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  loadData();
}, [token]);
```

---

#### 2. **Prevent Unnecessary API Calls on Mount**

```javascript
// ✅ CORRECT - Only run when token changes
useEffect(() => {
  if (!token) return; // Skip if no token

  const fetchData = async () => { /* ... */ };
  fetchData();
}, [token]); // Include all dependencies


// ❌ WRONG - Runs on every render
useEffect(() => {
  const fetchData = async () => { /* ... */ };
  fetchData(); // No dependency array!
});


// ❌ WRONG - Can cause race conditions
useEffect(() => {
  const fetchData = async () => { /* ... */ };
  fetchData();
}, []); // Empty deps, ignores token changes
```

---

#### 3. **Handle Token Expiration**

```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// In your API fetch wrapper:
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Token expired - clear auth and redirect
    logout();
    navigate('/login');
    throw new Error('Session expired. Please login again.');
  }
  return response;
};
```

---

#### 4. **Centralize API Configuration**

```javascript
// config/api.js
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const API_ENDPOINTS = {
  RECRUITER_STATS: '/auth/recruiter/dashboard/stats',
  MY_JOBS: '/jobs/my',
  MY_APPLICATIONS: '/applications/recruiter',
  // ... other endpoints
};
```

Usage:
```javascript
const statsRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RECRUITER_STATS}`, {
  headers: getAuthHeaders(),
});
```

---

#### 5. **Loading & Error State Management**

```javascript
const [state, setState] = useState({
  data: null,
  loading: false,
  error: null,
  isRetrying: false,
});

const fetchData = async () => {
  setState(prev => ({ ...prev, loading: true, error: null }));
  try {
    const data = await fetchWithAuth(url);
    setState(prev => ({ ...prev, data, loading: false }));
  } catch (err) {
    setState(prev => ({ ...prev, error: err.message, loading: false }));
  }
};
```

---

### ✅ Storage Best Practices

#### 1. **Secure Token Storage**
```javascript
// ✅ Good for non-sensitive apps (JWT with short expiry + refresh tokens)
localStorage.setItem('token', jwtToken);

// ⚠️ For highly sensitive apps, use:
// - Session storage (clears on tab close)
// - In-memory state with refresh tokens
// - HttpOnly cookies (server-set)
```

#### 2. **Handle Storage Errors Gracefully**
```javascript
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error(`Failed to read ${key}:`, err);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(`Failed to write ${key}:`, err);
      // Handle quota exceeded, etc.
    }
  },
};
```

---

### ✅ AuthContext Pattern - Complete Example

```javascript
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isAuthReady, setIsAuthReady] = useState(!!localStorage.getItem(TOKEN_KEY));

  // Mark auth as ready on mount
  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, [token]);

  const value = {
    user,
    token,
    isAuthReady,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### ✅ Component Usage Pattern

```javascript
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

function MyComponent() {
  const { token, getAuthHeaders } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only run when token is available
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/endpoint`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, getAuthHeaders]); // Include all dependencies

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>No data</div>;

  return <div>{/* render data */}</div>;
}
```

---

## Common Pitfalls to Avoid

| Issue | ❌ Wrong | ✅ Correct |
|-------|---------|-----------|
| **Missing deps** | `useEffect(() => { getAuthHeaders(); }, [])` | `useEffect(() => { getAuthHeaders(); }, [token])` |
| **API before token** | No token check | `if (!token) return;` |
| **Duplicate API calls** | No dependencies | `[token, getAuthHeaders]` |
| **Stale closures** | Token from outer scope | Token from dependency |
| **401 handling** | Ignore 401 responses | Logout and redirect on 401 |

---

## Testing Authentication

```javascript
// __tests__/auth.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestComponent() {
  const { token, isAuthReady } = useAuth();
  return (
    <div>
      {!isAuthReady && <p>Loading auth...</p>}
      {isAuthReady && !token && <p>Not authenticated</p>}
      {isAuthReady && token && <p>Authenticated</p>}
    </div>
  );
}

test('shows not authenticated when no token', () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  
  waitFor(() => {
    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
  });
});
```

---

## Summary of Changes

✅ **AuthContext.jsx:**
- Added `isAuthReady` state to track auth initialization
- Added useEffect to mark auth as ready on mount
- Replaced `isLoading` with `isAuthReady` in context value

✅ **RecruiterDashboard.jsx:**
- Added `getAuthHeaders` to useEffect dependency array
- Added debug logging to track API calls
- Better error messages
- Improved token check logic

These changes ensure your API calls only happen when authentication is fully ready and token is available! 🎉
