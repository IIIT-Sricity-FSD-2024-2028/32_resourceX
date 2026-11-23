import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as requestorService from '../../../services/requestor';

/**
 * Requestor Async Thunks
 * Assigned to: Person 3
 */
export const fetchRequests = createAsyncThunk('requestor/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchRequests(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createRequest = createAsyncThunk('requestor/createRequest', async (payload, { rejectWithValue }) => {
  try {
    return await requestorService.createRequest(payload);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchResources = createAsyncThunk('requestor/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchResources(params);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const requestorSlice = createSlice({
  name: 'requestor',
  initialState: {
    requests: [],
    resources: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRequestorError: (state) => {
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
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = action.payload || [];
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        if (action.payload) state.requests.unshift(action.payload);
      });
  },
});

export const { clearRequestorError } = requestorSlice.actions;
export default requestorSlice.reducer;
