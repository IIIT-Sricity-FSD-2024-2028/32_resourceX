import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as maintenanceService from '../../../services/maintenanceOfficer';

/**
 * Maintenance Officer Async Thunks
 * Assigned to: Person 4
 */
export const fetchMaintenanceResources = createAsyncThunk('maintenance/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await maintenanceService.fetchResources(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMaintenanceHistory = createAsyncThunk('maintenance/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    return await maintenanceService.fetchMaintenanceHistory();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const maintenanceOfficerSlice = createSlice({
  name: 'maintenanceOfficer',
  initialState: {
    resources: [],
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMaintenanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceResources.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMaintenanceResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload || [];
      })
      .addCase(fetchMaintenanceResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMaintenanceHistory.fulfilled, (state, action) => {
        state.history = action.payload || [];
      });
  },
});

export const { clearMaintenanceError } = maintenanceOfficerSlice.actions;
export default maintenanceOfficerSlice.reducer;
