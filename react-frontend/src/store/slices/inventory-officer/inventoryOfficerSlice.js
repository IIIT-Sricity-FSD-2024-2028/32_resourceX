import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as inventoryService from '../../../services/inventoryOfficer';

/**
 * Inventory Officer Async Thunks
 * Assigned to: Person 4
 */
export const fetchApprovedRequests = createAsyncThunk('inventory/fetchApproved', async (params, { rejectWithValue }) => {
  try {
    return await inventoryService.fetchApprovedRequests(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchResources = createAsyncThunk('inventory/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await inventoryService.fetchResources(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const inventoryOfficerSlice = createSlice({
  name: 'inventoryOfficer',
  initialState: {
    approvedRequests: [],
    resources: [],
    loading: false,
    error: null,
    resourcesLoading: false,
    resourcesError: null,
  },
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
      state.resourcesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovedRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApprovedRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.approvedRequests = action.payload || [];
      })
      .addCase(fetchApprovedRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resourcesLoading = false;
        state.resources = action.payload || [];
        state.resourcesError = null;
      })
      .addCase(fetchResources.pending, (state) => {
        state.resourcesLoading = true;
        state.resourcesError = null;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.resourcesLoading = false;
        state.resourcesError = action.payload || action.error.message;
      });
  },
});

export const { clearInventoryError } = inventoryOfficerSlice.actions;
export default inventoryOfficerSlice.reducer;
