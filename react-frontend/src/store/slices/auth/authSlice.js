import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getCurrentUser,
  loginUser as loginUserService,
  logoutUser as logoutUserService,
  persistSession,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
  verifyPasswordResetOtp as verifyPasswordResetOtpService,
} from '../../../services/auth';
import {
  fetchProfile as fetchProfileService,
  updatePassword as updatePasswordService,
  updateProfile as updateProfileService,
} from '../../../services/profile';

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

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, selectedOrgId }, { rejectWithValue }) => {
    try {
      const user = await loginUserService(email, password, selectedOrgId);
      persistSession(user);
      return user;
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed. Please verify credentials.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  logoutUserService();
});

export const fetchAuthProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const currentUser = getState().auth.user;
      const profile = await fetchProfileService();
      const token = profile?.token || currentUser?.token || getState().auth.token;
      const user = { ...(currentUser || {}), ...profile, ...(token ? { token } : {}) };
      persistSession(user);
      return user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load profile.');
    }
  }
);

export const updateAuthProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profile, { getState, rejectWithValue }) => {
    const currentUser = getState().auth.user;
    if (!currentUser) {
      return rejectWithValue('Cannot update a profile without an authenticated user.');
    }

    try {
      const updatedUser = await updateProfileService(profile);
      const token = updatedUser?.token || currentUser.token || getState().auth.token;
      const mergedUser = { ...currentUser, ...updatedUser, ...(token ? { token } : {}) };
      persistSession(mergedUser);
      return mergedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update profile.');
    }
  }
);

export const updateAuthPassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      return await updatePasswordService(currentPassword, newPassword);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update password.');
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      return await requestPasswordResetService(email);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to request a password reset.');
    }
  }
);

export const verifyPasswordResetOtp = createAsyncThunk(
  'auth/verifyPasswordResetOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      return await verifyPasswordResetOtpService(email, otp);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to verify the reset code.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ resetToken, newPassword }, { rejectWithValue }) => {
    try {
      return await resetPasswordService(resetToken, newPassword);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reset the password.');
    }
  }
);

const clearAuthState = (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  state.isLoading = false;
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    syncAuthSession: (state, action) => {
      state.user = action.payload || null;
      state.token = action.payload?.token || null;
      state.isAuthenticated = Boolean(action.payload);
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.token = action.payload?.token || null;
        state.isAuthenticated = Boolean(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(logout.pending, clearAuthState)
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAuthProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuthProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.token = action.payload?.token || null;
        state.isAuthenticated = Boolean(action.payload);
        state.isLoading = false;
      })
      .addCase(fetchAuthProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateAuthProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAuthProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.token = action.payload?.token || null;
        state.isAuthenticated = Boolean(action.payload);
        state.isLoading = false;
      })
      .addCase(updateAuthProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateAuthPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAuthPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateAuthPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(verifyPasswordResetOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPasswordResetOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyPasswordResetOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearAuthError, syncAuthSession } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
