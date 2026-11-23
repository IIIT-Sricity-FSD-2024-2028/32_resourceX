import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as procurementService from '../../../services/procurementOfficer';

/**
 * Procurement Officer Async Thunks
 * Assigned to: Person 5
 */
export const fetchProcurements = createAsyncThunk('procurement/fetchProcurements', async (params, { rejectWithValue }) => {
  try {
    return await procurementService.fetchProcurements(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createPurchaseOrder = createAsyncThunk('procurement/createOrder', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await procurementService.createPurchaseOrder(id, data);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const procurementOfficerSlice = createSlice({
  name: 'procurementOfficer',
  initialState: {
    procurements: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProcurementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProcurements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.loading = false;
        state.procurements = action.payload || [];
      })
      .addCase(fetchProcurements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProcurementError } = procurementOfficerSlice.actions;
export default procurementOfficerSlice.reducer;
