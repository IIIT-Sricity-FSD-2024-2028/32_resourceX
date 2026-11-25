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

const operationId = (action) =>
  typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg?.id;

const startOperation = (state, action) => {
  state.activeOperations.push({ requestId: action.meta.requestId, id: operationId(action) });
  state.processingIds = [...new Set(state.activeOperations.map((operation) => operation.id).filter((id) => id != null))];
  state.saving = true;
  state.operationError = null;
  state.error = null;
};

const finishOperation = (state, action) => {
  state.activeOperations = state.activeOperations.filter(
    (operation) => operation.requestId !== action.meta.requestId
  );
  state.processingIds = [...new Set(state.activeOperations.map((operation) => operation.id).filter((id) => id != null))];
  state.saving = state.activeOperations.length > 0;
};

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
    summaryError: null,
    requestsError: null,
    procurementsError: null,
    resourcesError: null,
    departmentsError: null,
    operationError: null,
    saving: false,
    processingIds: [],
    activeOperations: [],
    error: null,
  },
  reducers: {
    clearRegistrarError: (state) => {
      state.error = null;
      state.summaryError = null;
      state.requestsError = null;
      state.procurementsError = null;
      state.resourcesError = null;
      state.departmentsError = null;
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistrarSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
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
        state.summaryError = action.payload || action.error.message;
        state.error = state.summaryError;
      })
      .addCase(fetchRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
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
        state.requestsError = action.payload || action.error.message;
        state.error = state.requestsError;
      })
      .addCase(fetchProcurements.pending, (state) => {
        state.procurementsLoading = true;
        state.procurementsError = null;
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
        state.procurementsError = action.payload || action.error.message;
        state.error = state.procurementsError;
      })
      .addCase(fetchResources.pending, (state) => {
        state.resourcesLoading = true;
        state.resourcesError = null;
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
        state.resourcesError = action.payload || action.error.message;
        state.error = state.resourcesError;
      })
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.departmentsError = null;
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
        state.departmentsError = action.payload || action.error.message;
        state.error = state.departmentsError;
      });

    [approveRegistrarProcurement, rejectRegistrarProcurement].forEach((thunk) => {
      builder
        .addCase(thunk.pending, startOperation)
        .addCase(thunk.fulfilled, (state, action) => {
          finishOperation(state, action);
          const updated = action.payload;
          if (updated && updated.id) {
            const index = state.procurements.findIndex((p) => p.id === updated.id);
            if (index !== -1) {
              state.procurements[index] = { ...state.procurements[index], ...updated };
            }
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          finishOperation(state, action);
          state.operationError = action.payload || action.error.message;
          state.error = state.operationError;
        });
    });
  },
});

export const { clearRegistrarError } = registrarSlice.actions;
export const selectRegistrarSummary = (state) => state.registrar.summary;
export const selectRegistrarRequests = (state) => state.registrar.requests;
export const selectRegistrarProcurements = (state) => state.registrar.procurements;
export const selectRegistrarResources = (state) => state.registrar.resources;
export const selectRegistrarDepartments = (state) => state.registrar.departments;
export const selectRegistrarRequestsLoading = (state) =>
  state.registrar.requestsLoading || !state.registrar.requestsLoaded;
export const selectRegistrarProcurementsLoading = (state) =>
  state.registrar.procurementsLoading || !state.registrar.procurementsLoaded;
export const selectRegistrarProcessingIds = (state) => state.registrar.processingIds;
export default registrarSlice.reducer;
