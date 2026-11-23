import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as registrarService from '../../../services/registrar';

/**
 * Registrar Async Thunks
 * Assigned to: Person 5
 */
export const fetchRequests = createAsyncThunk('registrar/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    return await registrarService.fetchRequests(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchProcurements = createAsyncThunk('registrar/fetchProcurements', async (params, { rejectWithValue }) => {
  try {
    return await registrarService.fetchProcurements(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const registrarSlice = createSlice({
  name: 'registrar',
  initialState: {
    requests: [],
    procurements: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRegistrarError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload || [];
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.procurements = action.payload || [];
      });
  },
});

export const { clearRegistrarError } = registrarSlice.actions;
export default registrarSlice.reducer;
