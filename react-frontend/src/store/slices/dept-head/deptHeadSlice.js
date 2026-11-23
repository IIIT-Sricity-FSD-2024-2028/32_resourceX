import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as deptHeadService from '../../../services/deptHead';

/**
 * Department Head Async Thunks
 * Assigned to: Person 3
 */
export const fetchDeptRequests = createAsyncThunk('deptHead/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptRequests(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchDeptStock = createAsyncThunk('deptHead/fetchStock', async (_, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptStock();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const deptHeadSlice = createSlice({
  name: 'deptHead',
  initialState: {
    requests: [],
    stock: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDeptHeadError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeptRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeptRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload || [];
      })
      .addCase(fetchDeptRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDeptStock.fulfilled, (state, action) => {
        state.stock = action.payload || [];
      });
  },
});

export const { clearDeptHeadError } = deptHeadSlice.actions;
export default deptHeadSlice.reducer;
