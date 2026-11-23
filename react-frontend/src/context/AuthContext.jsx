import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setCredentials,
  updateUserProfile,
  logout as logoutAction,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading
} from '../store/slices/auth/authSlice';
import {
  loginUser as apiLoginUser,
  logoutUser as apiLogoutUser,
  getCurrentUser
} from '../services/auth';

const AuthContext = createContext(null);

/**
 * Global Authentication Provider (Redux-Integrated Bridge)
 * Uses Redux store as single source of truth while maintaining backward-compatibility
 * with existing components during sector migration.
 */
export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  // Sync with storage events across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'rx_data' || e.key === 'rx_token') {
        const storedUser = getCurrentUser();
        if (storedUser) {
          dispatch(setCredentials(storedUser));
        } else {
          dispatch(logoutAction());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  const login = useCallback(async (email, password, selectedOrgId) => {
    dispatch(setLoading(true));
    try {
      const userObj = await apiLoginUser(email, password, selectedOrgId);
      dispatch(setCredentials(userObj));
      return userObj;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    apiLogoutUser();
  }, [dispatch]);

  const updateUser = useCallback((updatedUserData) => {
    dispatch(updateUserProfile(updatedUserData));
  }, [dispatch]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
