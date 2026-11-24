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

const procurementOfficerSlice = createSlice({
  name: 'procurementOfficer',
  initialState: {
    procurements: [],
    loading: false,
    procurementsLoaded: false,
    saving: false,
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

    const operationThunks = [
      createPurchaseOrder,
      dispatchDelivery,
      logPurchase,
      editPurchaseOrder,
      editInvoice,
    ];

    operationThunks.forEach((thunk) => {
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

export const { clearProcurementError } = procurementOfficerSlice.actions;
export default procurementOfficerSlice.reducer;
