import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser,
  loginUser as apiLoginUser,
  logoutUser as apiLogoutUser,
  persistSession
} from '../services/auth';

const AuthContext = createContext(null);

/**
 * Global Authentication Provider
 * Manages reactive user session state and synchronizes with localStorage and backend auth APIs.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize across browser tabs/windows if storage is updated elsewhere
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'rx_data' || e.key === 'rx_token') {
        setUser(getCurrentUser());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Log in via backend API and update reactive state
   */
  const login = useCallback(async (email, password, selectedOrgId) => {
    setIsLoading(true);
    try {
      const userObj = await apiLoginUser(email, password, selectedOrgId);
      setUser(userObj);
      return userObj;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out and clear reactive state
   */
  const logout = useCallback(() => {
    apiLogoutUser();
    setUser(null);
  }, []);

  /**
   * Update active user attributes (e.g. name, preferences) and persist
   */
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedUserData };
      persistSession(merged);
      return merged;
    });
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to consume the authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
