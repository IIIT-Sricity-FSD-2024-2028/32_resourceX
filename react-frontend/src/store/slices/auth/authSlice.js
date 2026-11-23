import { createSlice } from '@reduxjs/toolkit';
import { getCurrentUser, persistSession, logoutUser as clearStoredSession } from '../../../services/auth';

const getInitialToken = () => {
  try {
    const rxData = JSON.parse(sessionStorage.getItem('rx_data'));
    return rxData?.currentUser?.token || sessionStorage.getItem('rx_token') || null;
  } catch {
    return null;
  }
};

const initialUser = getCurrentUser();

const initialState = {
  user: initialUser,
  token: getInitialToken(),
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const userObj = action.payload;
      state.user = userObj;
      state.token = userObj?.token || null;
      state.isAuthenticated = Boolean(userObj);
      state.isLoading = false;
      state.error = null;
      if (userObj) {
        persistSession(userObj);
      }
    },
    setLoading: (state, action) => {
      state.isLoading = Boolean(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload || null;
      state.isLoading = false;
    },
    updateUserProfile: (state, action) => {
      state.user = { ...(state.user || {}), ...action.payload };
      if (state.user) {
        persistSession(state.user);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      clearStoredSession();
    },
  },
});

export const { setCredentials, setLoading, setError, updateUserProfile, logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
