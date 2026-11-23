import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as deptHeadService from '../../../services/deptHead';

/**
 * Department Head Async Thunks
 * Assigned to: Person 3 (Requisitions Sector)
 */

export const fetchDeptRequests = createAsyncThunk('deptHead/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptRequests(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch department requests');
  }
});

export const approveDeptRequest = createAsyncThunk('deptHead/approveRequest', async (id, { rejectWithValue }) => {
  try {
    return await deptHeadService.approveDeptRequest(id);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to approve request');
  }
});

export const rejectDeptRequest = createAsyncThunk('deptHead/rejectRequest', async ({ id, reason }, { rejectWithValue }) => {
  try {
    return await deptHeadService.rejectDeptRequest(id, reason);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to reject request');
  }
});

export const fetchDeptStock = createAsyncThunk('deptHead/fetchStock', async (_, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptStock();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch stock');
  }
});

export const updateDeptStockThreshold = createAsyncThunk(
  'deptHead/updateStockThreshold',
  async ({ id, level }, { rejectWithValue }) => {
    try {
      return await deptHeadService.updateDeptStockThreshold(id, level);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update stock threshold');
    }
  }
);

export const fetchDeptSummary = createAsyncThunk('deptHead/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptSummary();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch department summary');
  }
});

export const fetchDeptResources = createAsyncThunk('deptHead/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await deptHeadService.fetchDeptResources(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch department resources');
  }
});

export const approveResourceExtension = createAsyncThunk(
  'deptHead/approveExtension',
  async (id, { rejectWithValue }) => {
    try {
      return await deptHeadService.approveResourceExtension(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve extension');
    }
  }
);

export const rejectResourceExtension = createAsyncThunk(
  'deptHead/rejectExtension',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await deptHeadService.rejectResourceExtension(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reject extension');
    }
  }
);

export const fetchDeptProcurements = createAsyncThunk(
  'deptHead/fetchProcurements',
  async (params, { rejectWithValue }) => {
    try {
      return await deptHeadService.fetchDeptProcurements(params);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch procurements');
    }
  }
);

export const createDeptProcurement = createAsyncThunk(
  'deptHead/createProcurement',
  async ({ payload, specFile }, { rejectWithValue }) => {
    try {
      return await deptHeadService.createDeptProcurement(payload, specFile);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create procurement');
    }
  }
);

export const approveDeptProcurement = createAsyncThunk(
  'deptHead/approveProcurement',
  async (id, { rejectWithValue }) => {
    try {
      return await deptHeadService.approveDeptProcurement(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve procurement');
    }
  }
);

export const rejectDeptProcurement = createAsyncThunk(
  'deptHead/rejectProcurement',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await deptHeadService.rejectDeptProcurement(id, reason);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reject procurement');
    }
  }
);

export const editDeptProcurement = createAsyncThunk(
  'deptHead/editProcurement',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await deptHeadService.editDeptProcurement(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to edit procurement');
    }
  }
);

export const cancelDeptProcurement = createAsyncThunk(
  'deptHead/cancelProcurement',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await deptHeadService.cancelDeptProcurement(id, reason);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to cancel procurement');
    }
  }
);

export const fetchDeptDashboardOverview = createAsyncThunk(
  'deptHead/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await deptHeadService.fetchDeptDashboardOverview();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch overview');
    }
  }
);

/**
 * Initial State
 */
const initialState = {
  requests: [],
  stock: [],
  resources: [],
  procurements: [],
  summary: null,
  loading: false,
  error: null,
  // UI & modal states
  selectedProcurementId: null,
  rejectRequestId: null,
  rejectReason: '',
  editThresholdItem: null,
  filters: {
    incomingSearch: '',
    incomingTypeFilter: 'All',
    incomingExtSearch: '',
    incomingExtTypeFilter: 'All',
    stockQuery: '',
    stockStatusFilter: 'All',
    resourceQuery: '',
    resourceStatusFilter: 'All',
    procSearch: '',
    procStatusFilter: 'All',
    procTypeFilter: 'All',
    overviewRequestSearch: '',
    overviewProcSearch: '',
  },
  modals: {
    rejectModalOpen: false,
    editThresholdOpen: false,
    procurementDetailOpen: false,
  },
};

const deptHeadSlice = createSlice({
  name: 'deptHead',
  initialState,
  reducers: {
    setSelectedProcurementId: (state, action) => {
      state.selectedProcurementId = action.payload;
      state.modals.procurementDetailOpen = Boolean(action.payload);
    },
    setRejectRequestId: (state, action) => {
      state.rejectRequestId = action.payload;
      state.modals.rejectModalOpen = Boolean(action.payload);
      if (!action.payload) {
        state.rejectReason = '';
      }
    },
    setRejectReason: (state, action) => {
      state.rejectReason = action.payload;
    },
    setEditThresholdItem: (state, action) => {
      state.editThresholdItem = action.payload;
      state.modals.editThresholdOpen = Boolean(action.payload);
    },
    setIncomingSearch: (state, action) => {
      state.filters.incomingSearch = action.payload;
    },
    setIncomingTypeFilter: (state, action) => {
      state.filters.incomingTypeFilter = action.payload;
    },
    setIncomingExtSearch: (state, action) => {
      state.filters.incomingExtSearch = action.payload;
    },
    setIncomingExtTypeFilter: (state, action) => {
      state.filters.incomingExtTypeFilter = action.payload;
    },
    setStockQuery: (state, action) => {
      state.filters.stockQuery = action.payload;
    },
    setStockStatusFilter: (state, action) => {
      state.filters.stockStatusFilter = action.payload;
    },
    setResourceQuery: (state, action) => {
      state.filters.resourceQuery = action.payload;
    },
    setResourceStatusFilter: (state, action) => {
      state.filters.resourceStatusFilter = action.payload;
    },
    setProcSearch: (state, action) => {
      state.filters.procSearch = action.payload;
    },
    setProcStatusFilter: (state, action) => {
      state.filters.procStatusFilter = action.payload;
    },
    setProcTypeFilter: (state, action) => {
      state.filters.procTypeFilter = action.payload;
    },
    setOverviewRequestSearch: (state, action) => {
      state.filters.overviewRequestSearch = action.payload;
    },
    setOverviewProcSearch: (state, action) => {
      state.filters.overviewProcSearch = action.payload;
    },
    closeDeptModals: (state) => {
      state.selectedProcurementId = null;
      state.rejectRequestId = null;
      state.rejectReason = '';
      state.editThresholdItem = null;
      state.modals = {
        rejectModalOpen: false,
        editThresholdOpen: false,
        procurementDetailOpen: false,
      };
    },
    resetDeptHeadFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    clearDeptHeadError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDeptRequests
      .addCase(fetchDeptRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeptRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDeptRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // approveDeptRequest
      .addCase(approveDeptRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.requests.findIndex((r) => r.id === updated.id);
          if (index !== -1) {
            state.requests[index] = { ...state.requests[index], ...updated };
          }
        }
      })
      // rejectDeptRequest
      .addCase(rejectDeptRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.requests.findIndex((r) => r.id === updated.id);
          if (index !== -1) {
            state.requests[index] = { ...state.requests[index], ...updated };
          }
        }
      })
      // fetchDeptStock
      .addCase(fetchDeptStock.fulfilled, (state, action) => {
        state.stock = Array.isArray(action.payload) ? action.payload : [];
      })
      // updateDeptStockThreshold
      .addCase(updateDeptStockThreshold.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.stock.findIndex((s) => s.id === updated.id);
          if (index !== -1) {
            state.stock[index] = { ...state.stock[index], ...updated };
          }
        }
      })
      // fetchDeptResources
      .addCase(fetchDeptResources.fulfilled, (state, action) => {
        state.resources = Array.isArray(action.payload) ? action.payload : [];
      })
      // fetchDeptSummary
      .addCase(fetchDeptSummary.fulfilled, (state, action) => {
        state.summary = action.payload || null;
      })
      // fetchDeptProcurements
      .addCase(fetchDeptProcurements.fulfilled, (state, action) => {
        state.procurements = Array.isArray(action.payload) ? action.payload : [];
      })
      // createDeptProcurement
      .addCase(createDeptProcurement.fulfilled, (state, action) => {
        if (action.payload) {
          state.procurements.unshift(action.payload);
        }
      })
      // overview
      .addCase(fetchDeptDashboardOverview.fulfilled, (state, action) => {
        if (action.payload) {
          state.summary = action.payload.summary || null;
          state.requests = action.payload.requests || [];
          state.resources = action.payload.resources || [];
          state.procurements = action.payload.procurements || [];
          state.stock = action.payload.stock || [];
        }
      });
  },
});

export const {
  setSelectedProcurementId,
  setRejectRequestId,
  setRejectReason,
  setEditThresholdItem,
  setIncomingSearch,
  setIncomingTypeFilter,
  setIncomingExtSearch,
  setIncomingExtTypeFilter,
  setStockQuery,
  setStockStatusFilter,
  setResourceQuery,
  setResourceStatusFilter,
  setProcSearch,
  setProcStatusFilter,
  setProcTypeFilter,
  setOverviewRequestSearch,
  setOverviewProcSearch,
  closeDeptModals,
  resetDeptHeadFilters,
  clearDeptHeadError,
} = deptHeadSlice.actions;

// Selectors
export const selectDeptRequests = (state) => state.deptHead?.requests || [];
export const selectDeptStock = (state) => state.deptHead?.stock || [];
export const selectDeptResources = (state) => state.deptHead?.resources || [];
export const selectDeptProcurements = (state) => state.deptHead?.procurements || [];
export const selectDeptSummary = (state) => state.deptHead?.summary || null;
export const selectDeptHeadLoading = (state) => state.deptHead?.loading || false;
export const selectDeptHeadError = (state) => state.deptHead?.error || null;
export const selectDeptHeadFilters = (state) => state.deptHead?.filters || initialState.filters;
export const selectSelectedProcurementId = (state) => state.deptHead?.selectedProcurementId || null;
export const selectRejectRequestState = (state) => ({
  id: state.deptHead?.rejectRequestId || null,
  reason: state.deptHead?.rejectReason || '',
});
export const selectEditThresholdItem = (state) => state.deptHead?.editThresholdItem || null;
export const selectDeptHeadModals = (state) => state.deptHead?.modals || initialState.modals;

export default deptHeadSlice.reducer;
