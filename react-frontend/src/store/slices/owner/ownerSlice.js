import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as ownerService from '../../../services/owner';

/**
 * Platform Owner Async Thunks
 * Assigned to: Person 6
 */
export const fetchOwnerOrganizations = createAsyncThunk('owner/fetchOrgs', async (_, { rejectWithValue }) => {
  try {
    return await ownerService.fetchOwnerOrganizations();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchOwnerEmployees = createAsyncThunk('owner/fetchEmployees', async (_, { rejectWithValue }) => {
  try {
    return await ownerService.fetchOwnerEmployees();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const ownerSlice = createSlice({
  name: 'owner',
  initialState: {
    organizations: [],
    employees: [],
    registrations: [],
    revenue: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearOwnerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerOrganizations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOwnerOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = action.payload || [];
      })
      .addCase(fetchOwnerOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOwnerEmployees.fulfilled, (state, action) => {
        state.employees = action.payload || [];
      });
  },
});

export const { clearOwnerError } = ownerSlice.actions;
export default ownerSlice.reducer;
