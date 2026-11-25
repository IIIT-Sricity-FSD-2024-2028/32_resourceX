import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import * as inventoryService from '../../../services/inventoryOfficer';

/**
 * Inventory Officer Async Thunks
 * Assigned to: Person 4
 */

const errorMessage = (err, fallback) => err?.message || fallback;

// ── Reads ──────────────────────────────────────────────────────────────────────

export const fetchInventoryOverview = createAsyncThunk(
  'inventory/fetchOverview',
  async (department, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchInventoryOfficerStats(department);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load overview.'));
    }
  }
);

export const fetchApprovedRequests = createAsyncThunk(
  'inventory/fetchApproved',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchApprovedRequests(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load approved requests.'));
    }
  }
);

export const fetchAvailableResources = createAsyncThunk(
  'inventory/fetchAvailable',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchAvailableResources(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load available resources.'));
    }
  }
);

export const fetchResources = createAsyncThunk(
  'inventory/fetchResources',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchResources(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load inventory.'));
    }
  }
);

export const fetchResourceCatalog = createAsyncThunk(
  'inventory/fetchCatalog',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchResourceCatalog(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load resource catalog.'));
    }
  }
);

export const fetchProcurements = createAsyncThunk(
  'inventory/fetchProcurements',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchProcurements(params);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load fulfilled procurements.'));
    }
  }
);

export const fetchReturnHistory = createAsyncThunk(
  'inventory/fetchReturnHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchReturnHistory();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load return history.'));
    }
  }
);

// ── Writes (each arg carries the id of the row being acted on) ───────────────

export const allocateRequest = createAsyncThunk(
  'inventory/allocateRequest',
  async ({ id, resourceIds }, { rejectWithValue }) => {
    try {
      return await inventoryService.allocateRequest(id, resourceIds);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Allocation failed.'));
    }
  }
);

export const createResource = createAsyncThunk(
  'inventory/createResource',
  async (data, { rejectWithValue }) => {
    try {
      return await inventoryService.createResource(data);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to add resource.'));
    }
  }
);

export const updateResource = createAsyncThunk(
  'inventory/updateResource',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await inventoryService.updateResource(id, data);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Update failed.'));
    }
  }
);

export const scrapResource = createAsyncThunk(
  'inventory/scrapResource',
  async (id, { rejectWithValue }) => {
    try {
      return await inventoryService.scrapResource(id);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Scrap failed.'));
    }
  }
);

export const requestResourceMaintenance = createAsyncThunk(
  'inventory/requestMaintenance',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await inventoryService.requestResourceMaintenance(id, data);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to send to maintenance.'));
    }
  }
);

export const registerProcurement = createAsyncThunk(
  'inventory/registerProcurement',
  async ({ id, resources }, { rejectWithValue }) => {
    try {
      return await inventoryService.registerProcurement(id, resources);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Registration failed.'));
    }
  }
);

export const processReturn = createAsyncThunk(
  'inventory/processReturn',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await inventoryService.processReturn(id, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Return processing failed.'));
    }
  }
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const asArray = (value) => (Array.isArray(value) ? value : []);

// The catalog endpoint returns either [{ resourceTypes }] or { resourceTypes }
const catalogTypesFrom = (catalog) => {
  if (Array.isArray(catalog)) return catalog[0]?.resourceTypes || [];
  return catalog?.resourceTypes || [];
};

const EMPTY_OVERVIEW = { stats: {}, requests: [], resources: [], returnHistory: [] };

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

const inventoryOfficerSlice = createSlice({
  name: 'inventoryOfficer',
  initialState: {
    overview: EMPTY_OVERVIEW,
    approvedRequests: [],
    availableResources: [],
    resources: [],
    catalogTypes: [],
    procurements: [],
    returnHistory: [],

    overviewLoading: false,
    approvedRequestsLoading: false,
    availableResourcesLoading: false,
    resourcesLoading: false,
    catalogTypesLoading: false,
    procurementsLoading: false,
    returnHistoryLoading: false,

    overviewLoaded: false,
    approvedRequestsLoaded: false,
    availableResourcesLoaded: false,
    resourcesLoaded: false,
    catalogTypesLoaded: false,
    procurementsLoaded: false,
    returnHistoryLoaded: false,

    overviewError: null,
    approvedRequestsError: null,
    availableResourcesError: null,
    resourcesError: null,
    catalogTypesError: null,
    procurementsError: null,
    returnHistoryError: null,

    operationError: null,
    saving: false,
    processingIds: [],
    activeOperations: [],
    error: null,
  },
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
      state.operationError = null;
      state.overviewError = null;
      state.approvedRequestsError = null;
      state.availableResourcesError = null;
      state.resourcesError = null;
      state.catalogTypesError = null;
      state.procurementsError = null;
      state.returnHistoryError = null;
    },
  },
  extraReducers: (builder) => {
    addCollectionCases(
      builder,
      fetchInventoryOverview,
      'overview',
      (payload) => ({ ...EMPTY_OVERVIEW, ...(payload || {}) }),
      EMPTY_OVERVIEW
    );
    addCollectionCases(builder, fetchApprovedRequests, 'approvedRequests', asArray, []);
    addCollectionCases(builder, fetchAvailableResources, 'availableResources', asArray, []);
    addCollectionCases(builder, fetchResources, 'resources', asArray, []);
    addCollectionCases(builder, fetchResourceCatalog, 'catalogTypes', catalogTypesFrom, []);
    addCollectionCases(builder, fetchProcurements, 'procurements', asArray, []);
    addCollectionCases(builder, fetchReturnHistory, 'returnHistory', asArray, []);

    [
      allocateRequest,
      createResource,
      updateResource,
      scrapResource,
      requestResourceMaintenance,
      registerProcurement,
      processReturn,
    ].forEach((thunk) => {
      builder
        .addCase(thunk.pending, startOperation)
        .addCase(thunk.fulfilled, finishOperation)
        .addCase(thunk.rejected, (state, action) => {
          finishOperation(state, action);
          state.operationError = action.payload || action.error.message;
          state.error = state.operationError;
        });
    });
  },
});

export const { clearInventoryError } = inventoryOfficerSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────

const selectSlice = (state) => state.inventoryOfficer;

export const selectInventoryOverview = (state) => selectSlice(state).overview;
export const selectInventoryOverviewLoading = (state) =>
  selectSlice(state).overviewLoading || !selectSlice(state).overviewLoaded;

export const selectApprovedRequests = (state) => selectSlice(state).approvedRequests;
export const selectApprovedRequestsLoading = (state) =>
  selectSlice(state).approvedRequestsLoading || !selectSlice(state).approvedRequestsLoaded;
export const selectAvailableResources = (state) => selectSlice(state).availableResources;
export const selectAvailableResourcesLoading = (state) =>
  selectSlice(state).availableResourcesLoading || !selectSlice(state).availableResourcesLoaded;

export const selectInventoryResources = (state) => selectSlice(state).resources;
export const selectInventoryResourcesLoading = (state) =>
  selectSlice(state).resourcesLoading || !selectSlice(state).resourcesLoaded;
export const selectReturnedResources = createSelector([selectInventoryResources], (resources) =>
  resources.filter((r) => r.status === 'Returned')
);

export const selectCatalogTypes = (state) => selectSlice(state).catalogTypes;

export const selectFulfilledProcurements = createSelector(
  [(state) => selectSlice(state).procurements],
  (procurements) => procurements.filter((p) => p.status === 'Fulfilled')
);
export const selectProcurementsLoading = (state) =>
  selectSlice(state).procurementsLoading || !selectSlice(state).procurementsLoaded;

export const selectReturnHistory = (state) => selectSlice(state).returnHistory;

export const selectInventoryProcessingIds = (state) => selectSlice(state).processingIds;
export const selectInventorySaving = (state) => selectSlice(state).saving;
export const selectInventoryError = (state) => selectSlice(state).error;

export default inventoryOfficerSlice.reducer;
