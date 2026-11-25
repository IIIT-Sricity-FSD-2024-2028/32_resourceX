import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import * as maintenanceService from '../../../services/maintenanceOfficer';

/**
 * Maintenance Officer Async Thunks
 * Assigned to: Person 4
 */

const errorMessage = (err, fallback) => err?.message || fallback;

// ── Reads ──────────────────────────────────────────────────────────────────────

export const fetchMaintenanceOverview = createAsyncThunk(
  'maintenance/fetchOverview',
  async (department, { rejectWithValue }) => {
    try {
      return await maintenanceService.fetchMaintenanceOfficerStats(department);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load overview.'));
    }
  }
);

export const fetchMaintenanceResources = createAsyncThunk(
  'maintenance/fetchResources',
  async (params, { rejectWithValue }) => {
    try {
      return await maintenanceService.fetchResources(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load maintenance queue.'));
    }
  }
);

export const fetchMaintenanceHistory = createAsyncThunk(
  'maintenance/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await maintenanceService.fetchMaintenanceHistory();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load maintenance history.'));
    }
  }
);

// ── Writes (each arg carries the id of the resource being acted on) ──────────

export const acceptMaintenance = createAsyncThunk(
  'maintenance/accept',
  async ({ id, payload = {} }, { rejectWithValue }) => {
    try {
      return await maintenanceService.acceptMaintenance(id, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to accept maintenance.'));
    }
  }
);

export const repairMaintenance = createAsyncThunk(
  'maintenance/repair',
  async ({ id, payload = {} }, { rejectWithValue }) => {
    try {
      return await maintenanceService.repairMaintenance(id, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to complete repair.'));
    }
  }
);

export const scrapMaintenance = createAsyncThunk(
  'maintenance/scrap',
  async ({ id, payload = {} }, { rejectWithValue }) => {
    try {
      return await maintenanceService.scrapMaintenance(id, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Scrap action failed.'));
    }
  }
);

export const processMaintenanceReturn = createAsyncThunk(
  'maintenance/processReturn',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await maintenanceService.processReturn(id, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Return processing failed.'));
    }
  }
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const asArray = (value) => (Array.isArray(value) ? value : []);

const EMPTY_OVERVIEW = { stats: {}, resources: [], maintHistory: [] };

/** Adds pending/fulfilled/rejected cases that keep `<key>`, `<key>Loading`, `<key>Loaded`, `<key>Error` in step. */
const addCollectionCases = (builder, thunk, key, toValue, emptyValue) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[`${key}Loading`] = true;
      state[`${key}Error`] = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[`${key}Loading`] = false;
      state[`${key}Loaded`] = true;
      state[key] = toValue(action.payload);
    })
    .addCase(thunk.rejected, (state, action) => {
      state[`${key}Loading`] = false;
      state[`${key}Loaded`] = true;
      state[`${key}Error`] = action.payload || action.error.message;
      state[key] = emptyValue;
      state.error = state[`${key}Error`];
    });
};

const operationId = (action) =>
  typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg?.id;

const syncProcessing = (state) => {
  state.processingIds = [
    ...new Set(state.activeOperations.map((op) => op.id).filter((id) => id != null)),
  ];
  state.saving = state.activeOperations.length > 0;
};

const startOperation = (state, action) => {
  state.activeOperations.push({ requestId: action.meta.requestId, id: operationId(action) });
  state.operationError = null;
  syncProcessing(state);
};

const finishOperation = (state, action) => {
  state.activeOperations = state.activeOperations.filter(
    (op) => op.requestId !== action.meta.requestId
  );
  syncProcessing(state);
};

const maintenanceOfficerSlice = createSlice({
  name: 'maintenanceOfficer',
  initialState: {
    overview: EMPTY_OVERVIEW,
    resources: [],
    history: [],

    overviewLoading: false,
    resourcesLoading: false,
    historyLoading: false,

    overviewLoaded: false,
    resourcesLoaded: false,
    historyLoaded: false,

    overviewError: null,
    resourcesError: null,
    historyError: null,

    operationError: null,
    saving: false,
    processingIds: [],
    activeOperations: [],
    error: null,
  },
  reducers: {
    clearMaintenanceError: (state) => {
      state.error = null;
      state.operationError = null;
      state.overviewError = null;
      state.resourcesError = null;
      state.historyError = null;
    },
  },
  extraReducers: (builder) => {
    addCollectionCases(
      builder,
      fetchMaintenanceOverview,
      'overview',
      (payload) => ({ ...EMPTY_OVERVIEW, ...(payload || {}) }),
      EMPTY_OVERVIEW
    );
    addCollectionCases(builder, fetchMaintenanceResources, 'resources', asArray, []);
    addCollectionCases(builder, fetchMaintenanceHistory, 'history', asArray, []);

    [acceptMaintenance, repairMaintenance, scrapMaintenance, processMaintenanceReturn].forEach(
      (thunk) => {
        builder
          .addCase(thunk.pending, startOperation)
          .addCase(thunk.fulfilled, finishOperation)
          .addCase(thunk.rejected, (state, action) => {
            finishOperation(state, action);
            state.operationError = action.payload || action.error.message;
            state.error = state.operationError;
          });
      }
    );
  },
});

export const { clearMaintenanceError } = maintenanceOfficerSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────

const selectSlice = (state) => state.maintenanceOfficer;

export const selectMaintenanceOverview = (state) => selectSlice(state).overview;
export const selectMaintenanceOverviewLoading = (state) =>
  selectSlice(state).overviewLoading || !selectSlice(state).overviewLoaded;

export const selectMaintenanceResources = (state) => selectSlice(state).resources;
export const selectMaintenanceResourcesLoading = (state) =>
  selectSlice(state).resourcesLoading || !selectSlice(state).resourcesLoaded;

/** Resources waiting for, or currently under, maintenance. */
export const selectMaintenanceQueue = createSelector([selectMaintenanceResources], (resources) =>
  resources.filter((r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance')
);

/** Resources returned by users and waiting to be inspected. */
export const selectMaintenanceReturnedResources = createSelector(
  [selectMaintenanceResources],
  (resources) => resources.filter((r) => r.status === 'Returned')
);

export const selectMaintenanceHistory = (state) => selectSlice(state).history;
export const selectMaintenanceHistoryLoading = (state) =>
  selectSlice(state).historyLoading || !selectSlice(state).historyLoaded;

export const selectMaintenanceProcessingIds = (state) => selectSlice(state).processingIds;
export const selectMaintenanceSaving = (state) => selectSlice(state).saving;
export const selectMaintenanceError = (state) => selectSlice(state).error;

export default maintenanceOfficerSlice.reducer;
