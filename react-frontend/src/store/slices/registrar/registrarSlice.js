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
    return rejectWithValue(err.message || 'Failed to fetch requests');
  }
});

export const fetchProcurements = createAsyncThunk('registrar/fetchProcurements', async (params, { rejectWithValue }) => {
  try {
    return await registrarService.fetchProcurements(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch procurements');
  }
});

export const fetchDepartments = createAsyncThunk('registrar/fetchDepartments', async (_, { rejectWithValue }) => {
  try {
    return await registrarService.fetchDepartments();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch departments');
  }
});

export const approveRegistrarProcurement = createAsyncThunk(
  'registrar/approveProcurement',
  async (id, { rejectWithValue }) => {
    try {
      return await registrarService.approveRegistrarProcurement(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve procurement');
    }
  }
);

export const rejectRegistrarProcurement = createAsyncThunk(
  'registrar/rejectProcurement',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await registrarService.rejectRegistrarProcurement(id, reason);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reject procurement');
    }
  }
);

const registrarSlice = createSlice({
  name: 'registrar',
  initialState: {
    requests: [],
    procurements: [],
    departments: [],
    requestsLoading: false,
    procurementsLoading: false,
    departmentsLoading: false,
    saving: false,
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
        state.requestsLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchProcurements.pending, (state) => {
        state.procurementsLoading = true;
        state.error = null;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.procurementsLoading = false;
        state.procurements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProcurements.rejected, (state, action) => {
        state.procurementsLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsLoading = false;
        state.error = action.payload || action.error.message;
      });

    [approveRegistrarProcurement, rejectRegistrarProcurement].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.saving = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.saving = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.saving = false;
          state.error = action.payload || action.error.message;
        });
    });
  },
});

export const { clearRegistrarError } = registrarSlice.actions;
export default registrarSlice.reducer;
