import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as procurementService from '../../../services/procurementOfficer';

/**
 * Procurement Officer Async Thunks
 * Assigned to: Person 5
 */
export const fetchProcurements = createAsyncThunk('procurement/fetchProcurements', async (params, { rejectWithValue }) => {
  try {
    return await procurementService.fetchProcurements(params);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch procurements');
  }
});

export const createPurchaseOrder = createAsyncThunk(
  'procurement/createOrder',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await procurementService.createPurchaseOrder(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create purchase order');
    }
  }
);

export const dispatchDelivery = createAsyncThunk(
  'procurement/dispatchDelivery',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await procurementService.dispatchDelivery(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to dispatch delivery');
    }
  }
);

export const logPurchase = createAsyncThunk(
  'procurement/logPurchase',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await procurementService.logPurchase(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to log purchase');
    }
  }
);

export const editPurchaseOrder = createAsyncThunk(
  'procurement/editPurchaseOrder',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await procurementService.editPurchaseOrder(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to edit purchase order');
    }
  }
);

export const editInvoice = createAsyncThunk(
  'procurement/editInvoice',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await procurementService.editInvoice(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to edit invoice');
    }
  }
);

const operationId = (action) =>
  typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg?.id;

const startOperation = (state, action) => {
  state.activeOperations.push({ requestId: action.meta.requestId, id: operationId(action) });
  state.savingIds = [...new Set(state.activeOperations.map((operation) => operation.id).filter((id) => id != null))];
  state.saving = true;
  state.error = null;
};

const finishOperation = (state, action) => {
  state.activeOperations = state.activeOperations.filter(
    (operation) => operation.requestId !== action.meta.requestId
  );
  state.savingIds = [...new Set(state.activeOperations.map((operation) => operation.id).filter((id) => id != null))];
  state.saving = state.activeOperations.length > 0;
};

const updateProcurementInState = (state, updated) => {
  if (updated?.id) {
    const index = state.procurements.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      state.procurements[index] = { ...state.procurements[index], ...updated };
    } else {
      state.procurements.unshift(updated);
    }
  }
};

const procurementOfficerSlice = createSlice({
  name: 'procurementOfficer',
  initialState: {
    procurements: [],
    loading: false,
    procurementsLoaded: false,
    saving: false,
    savingIds: [],
    activeOperations: [],
    error: null,
  },
  reducers: {
    clearProcurementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProcurements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProcurements.fulfilled, (state, action) => {
        state.loading = false;
        state.procurementsLoaded = true;
        state.procurements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProcurements.rejected, (state, action) => {
        state.loading = false;
        state.procurementsLoaded = true;
        state.error = action.payload || action.error.message;
      });

    [createPurchaseOrder, dispatchDelivery, logPurchase, editPurchaseOrder, editInvoice].forEach((thunk) => {
      builder
        .addCase(thunk.pending, startOperation)
        .addCase(thunk.fulfilled, (state, action) => {
          finishOperation(state, action);
          updateProcurementInState(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          finishOperation(state, action);
          state.error = action.payload || action.error.message;
        });
    });
  },
});

export const { clearProcurementError } = procurementOfficerSlice.actions;
export const selectProcurements = (state) => state.procurementOfficer.procurements;
export const selectProcurementsLoading = (state) =>
  state.procurementOfficer.loading || !state.procurementOfficer.procurementsLoaded;
export const selectProcurementSaving = (state) => state.procurementOfficer.saving;
export const selectProcurementSavingIds = (state) => state.procurementOfficer.savingIds;
export const selectProcurementError = (state) => state.procurementOfficer.error;
export default procurementOfficerSlice.reducer;
