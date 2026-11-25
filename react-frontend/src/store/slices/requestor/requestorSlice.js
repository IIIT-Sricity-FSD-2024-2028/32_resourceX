import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as requestorService from '../../../services/requestor';

/**
 * Requestor Async Thunks
 * Assigned to: Person 3 (Requisitions Sector)
 */

export const fetchRequests = createAsyncThunk('requestor/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchRequests(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch requests');
  }
});

export const createRequest = createAsyncThunk('requestor/createRequest', async (payload, { rejectWithValue }) => {
  try {
    return await requestorService.createRequest(payload);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to create request');
  }
});

export const confirmReceipt = createAsyncThunk('requestor/confirmReceipt', async (id, { rejectWithValue }) => {
  try {
    return await requestorService.confirmReceipt(id);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to confirm receipt');
  }
});

export const editRequest = createAsyncThunk('requestor/editRequest', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await requestorService.editRequest(id, payload);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to edit request');
  }
});

export const cancelRequest = createAsyncThunk('requestor/cancelRequest', async ({ id, reason }, { rejectWithValue }) => {
  try {
    return await requestorService.cancelRequest(id, reason);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to cancel request');
  }
});

export const fetchResources = createAsyncThunk('requestor/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchResources(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch resources');
  }
});

export const requestResourceMaintenance = createAsyncThunk(
  'requestor/requestMaintenance',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await requestorService.requestResourceMaintenance(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to request maintenance');
    }
  }
);

export const initiateResourceReturn = createAsyncThunk(
  'requestor/initiateReturn',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await requestorService.initiateResourceReturn(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to initiate return');
    }
  }
);

export const confirmRepairedAllocation = createAsyncThunk(
  'requestor/confirmRepaired',
  async (id, { rejectWithValue }) => {
    try {
      return await requestorService.confirmRepairedAllocation(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to confirm repaired allocation');
    }
  }
);

export const requestResourceExtension = createAsyncThunk(
  'requestor/requestExtension',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await requestorService.requestResourceExtension(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to request extension');
    }
  }
);

export const fetchRequestorReturnHistory = createAsyncThunk(
  'requestor/fetchReturnHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await requestorService.fetchRequestorReturnHistory();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch return history');
    }
  }
);

export const fetchRequestorMaintenanceHistory = createAsyncThunk(
  'requestor/fetchMaintenanceHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await requestorService.fetchRequestorMaintenanceHistory();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch maintenance history');
    }
  }
);

export const fetchStock = createAsyncThunk('requestor/fetchStock', async (_, { rejectWithValue }) => {
  try {
    return await requestorService.fetchStock();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch stock');
  }
});

export const fetchResourceAvailability = createAsyncThunk(
  'requestor/fetchResourceAvailability',
  async ({ department, type }, { rejectWithValue }) => {
    try {
      return await requestorService.fetchResourceAvailability(department, type);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch resource availability');
    }
  }
);

export const fetchDepartments = createAsyncThunk('requestor/fetchDepartments', async (_, { rejectWithValue }) => {
  try {
    return await requestorService.fetchDepartments();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch departments');
  }
});

export const fetchResourceCatalog = createAsyncThunk('requestor/fetchCatalog', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchResourceCatalog(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch catalog');
  }
});

export const fetchRequestorSummary = createAsyncThunk('requestor/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    return await requestorService.fetchRequestorSummary();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch summary');
  }
});

export const fetchProcurements = createAsyncThunk('requestor/fetchProcurements', async (params, { rejectWithValue }) => {
  try {
    return await requestorService.fetchProcurements(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch procurements');
  }
});

export const createProcurement = createAsyncThunk(
  'requestor/createProcurement',
  async ({ payload, rawFile }, { rejectWithValue }) => {
    try {
      return await requestorService.createProcurement(payload, rawFile);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create procurement');
    }
  }
);

export const fetchRequestorDashboardOverview = createAsyncThunk(
  'requestor/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await requestorService.fetchRequestorDashboardOverview();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch overview');
    }
  }
);

/**
 * Initial State
 */
const initialRequestForm = {
  selectedDept: '',
  selectedType: '',
  quantity: 1,
  reason: '',
  requirementDate: '',
  returnDate: '',
  availableCount: null,
};

const initialState = {
  requests: [],
  resources: [],
  stock: [],
  returnHistory: [],
  maintenanceHistory: [],
  departments: [],
  catalog: [],
  summary: null,
  procurements: [],
  loading: false,
  error: null,
  // UI & navigation states
  activeTab: 'dashboard',
  historyActiveTab: 'returns', // 'returns' | 'maintenance'
  selectedRequestId: null,
  selectedResourceId: null,
  requestForm: { ...initialRequestForm },
  filters: {
    search: '',
    statusFilter: 'All',
    deptFilter: 'All',
    resourceSearch: '',
    resourceStatusFilter: 'All',
    deadlineFilter: 'All',
    historySearch: '',
    historyConditionFilter: 'All',
    historyMaintFilter: 'All',
  },
  modals: {
    requestDetailOpen: false,
    maintenanceOpen: false,
    returnOpen: false,
    extensionOpen: false,
    filePreview: null,
  },
};

const requestorSlice = createSlice({
  name: 'requestor',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setHistoryActiveTab: (state, action) => {
      state.historyActiveTab = action.payload;
    },
    setSelectedRequestId: (state, action) => {
      state.selectedRequestId = action.payload;
      state.modals.requestDetailOpen = Boolean(action.payload);
    },
    setSelectedResourceId: (state, action) => {
      state.selectedResourceId = action.payload;
    },
    setRequestFormField: (state, action) => {
      const { field, value } = action.payload;
      state.requestForm[field] = value;
    },
    setRequestFormAvailableCount: (state, action) => {
      state.requestForm.availableCount = action.payload;
    },
    resetRequestForm: (state) => {
      state.requestForm = { ...initialRequestForm };
    },
    setRequestSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setRequestStatusFilter: (state, action) => {
      state.filters.statusFilter = action.payload;
    },
    setRequestDeptFilter: (state, action) => {
      state.filters.deptFilter = action.payload;
    },
    setResourceSearch: (state, action) => {
      state.filters.resourceSearch = action.payload;
    },
    setResourceStatusFilter: (state, action) => {
      state.filters.resourceStatusFilter = action.payload;
    },
    setDeadlineFilter: (state, action) => {
      state.filters.deadlineFilter = action.payload;
    },
    setHistorySearch: (state, action) => {
      state.filters.historySearch = action.payload;
    },
    setHistoryConditionFilter: (state, action) => {
      state.filters.historyConditionFilter = action.payload;
    },
    setHistoryMaintFilter: (state, action) => {
      state.filters.historyMaintFilter = action.payload;
    },
    setFilePreview: (state, action) => {
      state.modals.filePreview = action.payload;
    },
    clearFilePreview: (state) => {
      state.modals.filePreview = null;
    },
    closeRequestDetailModal: (state) => {
      state.selectedRequestId = null;
      state.modals.requestDetailOpen = false;
    },
    resetRequestorFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    clearRequestorError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRequests
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createRequest
      .addCase(createRequest.fulfilled, (state, action) => {
        if (action.payload) {
          state.requests.unshift(action.payload);
        }
      })
      // confirmReceipt
      .addCase(confirmReceipt.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.requests.findIndex((r) => r.id === updated.id);
          if (index !== -1) {
            state.requests[index] = { ...state.requests[index], ...updated };
          }
        }
      })
      // editRequest
      .addCase(editRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.requests.findIndex((r) => r.id === updated.id);
          if (index !== -1) {
            state.requests[index] = { ...state.requests[index], ...updated };
          }
        }
      })
      // cancelRequest
      .addCase(cancelRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.requests.findIndex((r) => r.id === updated.id);
          if (index !== -1) {
            state.requests[index] = { ...state.requests[index], ...updated };
          }
        }
      })
      // fetchResources
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = Array.isArray(action.payload) ? action.payload : [];
      })
      // fetchStock
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.stock = Array.isArray(action.payload) ? action.payload : [];
      })
      // return & maintenance history
      .addCase(fetchRequestorReturnHistory.fulfilled, (state, action) => {
        state.returnHistory = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRequestorMaintenanceHistory.fulfilled, (state, action) => {
        state.maintenanceHistory = Array.isArray(action.payload) ? action.payload : [];
      })
      // departments & catalog
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchResourceCatalog.fulfilled, (state, action) => {
        state.catalog = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRequestorSummary.fulfilled, (state, action) => {
        state.summary = action.payload || null;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.procurements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createProcurement.fulfilled, (state, action) => {
        const created = action.payload;
        if (created?.id) {
          const index = state.procurements.findIndex((procurement) => procurement.id === created.id);
          if (index === -1) {
            state.procurements.unshift(created);
          } else {
            state.procurements[index] = { ...state.procurements[index], ...created };
          }
        }
      })
      // overview
      .addCase(fetchRequestorDashboardOverview.fulfilled, (state, action) => {
        if (action.payload) {
          state.departments = action.payload.departments || [];
          state.catalog = action.payload.resourceCatalog || [];
          state.requests = action.payload.requests || [];
          state.resources = action.payload.resources || [];
          state.stock = action.payload.stock || [];
          state.procurements = action.payload.procurements || [];
          state.summary = action.payload.summary || null;
        }
      });
  },
});

export const {
  setActiveTab,
  setHistoryActiveTab,
  setSelectedRequestId,
  setSelectedResourceId,
  setRequestFormField,
  setRequestFormAvailableCount,
  resetRequestForm,
  setRequestSearch,
  setRequestStatusFilter,
  setRequestDeptFilter,
  setResourceSearch,
  setResourceStatusFilter,
  setDeadlineFilter,
  setHistorySearch,
  setHistoryConditionFilter,
  setHistoryMaintFilter,
  setFilePreview,
  clearFilePreview,
  closeRequestDetailModal,
  resetRequestorFilters,
  clearRequestorError,
} = requestorSlice.actions;

// Selectors
export const selectRequests = (state) => state.requestor?.requests || [];
export const selectResources = (state) => state.requestor?.resources || [];
export const selectStock = (state) => state.requestor?.stock || [];
export const selectReturnHistory = (state) => state.requestor?.returnHistory || [];
export const selectMaintenanceHistory = (state) => state.requestor?.maintenanceHistory || [];
export const selectDepartments = (state) => state.requestor?.departments || [];
export const selectCatalog = (state) => state.requestor?.catalog || [];
export const selectRequestorSummary = (state) => state.requestor?.summary || null;
export const selectProcurements = (state) => state.requestor?.procurements || [];
export const selectRequestorLoading = (state) => state.requestor?.loading || false;
export const selectRequestorError = (state) => state.requestor?.error || null;
export const selectRequestorActiveTab = (state) => state.requestor?.activeTab || 'dashboard';
export const selectHistoryActiveTab = (state) => state.requestor?.historyActiveTab || 'returns';
export const selectSelectedRequestId = (state) => state.requestor?.selectedRequestId || null;
export const selectSelectedResourceId = (state) => state.requestor?.selectedResourceId || null;
export const selectRequestForm = (state) => state.requestor?.requestForm || initialRequestForm;
export const selectRequestorFilters = (state) => state.requestor?.filters || initialState.filters;
export const selectRequestorModals = (state) => state.requestor?.modals || initialState.modals;
export const selectRequestorFilePreview = (state) => state.requestor?.modals?.filePreview || null;

export default requestorSlice.reducer;
