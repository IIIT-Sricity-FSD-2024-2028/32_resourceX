import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminService from '../../../services/admin';

/**
 * System Admin Async Thunks
 * Assigned to: Person 2
 */
export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    return await adminService.fetchAdminUsers();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createAdminUser = createAsyncThunk('admin/createUser', async (userData, { rejectWithValue }) => {
  try {
    return await adminService.createAdminUser(userData);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateAdminUser = createAsyncThunk('admin/updateUser', async ({ id, userData }, { rejectWithValue }) => {
  try {
    return await adminService.updateAdminUser(id, userData);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAdminDepartments = createAsyncThunk('admin/fetchDepartments', async (_, { rejectWithValue }) => {
  try {
    return await adminService.fetchAdminDepartments();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createAdminDepartment = createAsyncThunk('admin/createDepartment', async (deptData, { rejectWithValue }) => {
  try {
    return await adminService.createAdminDepartment(deptData);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAdminSupportTickets = createAsyncThunk('admin/fetchSupportTickets', async (_, { rejectWithValue }) => {
  try {
    return await adminService.fetchAdminSupportTickets();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAdminAnnouncements = createAsyncThunk('admin/fetchAnnouncements', async (_, { rejectWithValue }) => {
  try {
    return await adminService.fetchAdminAnnouncements();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [],
    departments: [],
    tickets: [],
    announcements: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        if (action.payload) state.users.unshift(action.payload);
      })
      // Departments
      .addCase(fetchAdminDepartments.fulfilled, (state, action) => {
        state.departments = action.payload || [];
      })
      .addCase(createAdminDepartment.fulfilled, (state, action) => {
        if (action.payload) state.departments.unshift(action.payload);
      })
      // Tickets & Announcements
      .addCase(fetchAdminSupportTickets.fulfilled, (state, action) => {
        state.tickets = action.payload || [];
      })
      .addCase(fetchAdminAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload || [];
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
