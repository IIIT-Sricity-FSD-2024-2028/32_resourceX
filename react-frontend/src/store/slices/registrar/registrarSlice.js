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

export const fetchRegistrarSummary = createAsyncThunk('registrar/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    return await registrarService.fetchRegistrarSummary();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch registrar summary');
  }
});

export const fetchResources = createAsyncThunk('registrar/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await registrarService.fetchResources(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch resources');
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
    summary: null,
    requests: [],
    procurements: [],
    resources: [],
    departments: [],
    summaryLoading: false,
    requestsLoading: false,
    procurementsLoading: false,
    resourcesLoading: false,
    departmentsLoading: false,
    summaryLoaded: false,
    requestsLoaded: false,
    procurementsLoaded: false,
    resourcesLoaded: false,
    departmentsLoaded: false,
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
      .addCase(fetchRegistrarSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchRegistrarSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaryLoaded = true;
        state.summary = action.payload;
      })
      .addCase(fetchRegistrarSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryLoaded = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchRequests.pending, (state) => {
        state.requestsLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requestsLoaded = true;
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsLoaded = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchProcurements.pending, (state) => {
        state.procurementsLoading = true;
        state.error = null;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.procurementsLoading = false;
        state.procurementsLoaded = true;
        state.procurements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProcurements.rejected, (state, action) => {
        state.procurementsLoading = false;
        state.procurementsLoaded = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchResources.pending, (state) => {
        state.resourcesLoading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resourcesLoading = false;
        state.resourcesLoaded = true;
        state.resources = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.resourcesLoading = false;
        state.resourcesLoaded = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departmentsLoaded = true;
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsLoading = false;
        state.departmentsLoaded = true;
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
