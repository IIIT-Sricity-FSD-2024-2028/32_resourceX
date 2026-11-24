import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as ownerService from '../../../services/owner';

/**
 * Platform Owner Async Thunks
 * Assigned to: Person 6 (Platform Owner)
 */

export const fetchOwnerOrganizations = createAsyncThunk(
  'owner/fetchOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerOrganizations();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch organizations');
    }
  }
);

export const approveOwnerOrganization = createAsyncThunk(
  'owner/approveOrganization',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'object' ? (payload.id || payload.orgId) : payload;
      const employeeId = typeof payload === 'object' ? payload.employeeId : undefined;
      return await ownerService.approveOwnerOrganization(id, employeeId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve organization');
    }
  }
);

export const suspendOwnerOrganization = createAsyncThunk(
  'owner/suspendOrganization',
  async (id, { rejectWithValue }) => {
    try {
      return await ownerService.suspendOwnerOrganization(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend organization');
    }
  }
);

export const reactivateOwnerOrganization = createAsyncThunk(
  'owner/reactivateOrganization',
  async (id, { rejectWithValue }) => {
    try {
      return await ownerService.reactivateOwnerOrganization(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate organization');
    }
  }
);

export const assignOwnerOrganizationEmployee = createAsyncThunk(
  'owner/assignOrganizationEmployee',
  async (payload, { rejectWithValue }) => {
    try {
      const orgId = typeof payload === 'object' ? (payload.orgId || payload.id) : payload;
      const employeeId = typeof payload === 'object' ? payload.employeeId : undefined;
      return await ownerService.assignOwnerOrganizationEmployee(orgId, employeeId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to assign employee');
    }
  }
);

export const fetchOwnerEmployees = createAsyncThunk(
  'owner/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerEmployees();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch employees');
    }
  }
);

export const createOwnerEmployee = createAsyncThunk(
  'owner/createEmployee',
  async (employeeData, { rejectWithValue }) => {
    try {
      return await ownerService.createOwnerEmployee(employeeData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create employee');
    }
  }
);

export const updateOwnerEmployee = createAsyncThunk(
  'owner/updateEmployee',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await ownerService.updateOwnerEmployee(id, payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update employee');
    }
  }
);

export const removeOwnerEmployee = createAsyncThunk(
  'owner/removeEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const res = await ownerService.removeOwnerEmployee(id);
      return { id, ...(res || {}) };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to remove employee');
    }
  }
);

export const suspendOwnerEmployee = createAsyncThunk(
  'owner/suspendEmployee',
  async (id, { rejectWithValue }) => {
    try {
      return await ownerService.suspendOwnerEmployee(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend employee');
    }
  }
);

export const reactivateOwnerEmployee = createAsyncThunk(
  'owner/reactivateEmployee',
  async (id, { rejectWithValue }) => {
    try {
      return await ownerService.reactivateOwnerEmployee(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate employee');
    }
  }
);

export const bulkCreateOwnerEmployees = createAsyncThunk(
  'owner/bulkCreateEmployees',
  async (rows, { rejectWithValue }) => {
    try {
      return await ownerService.bulkCreateOwnerEmployees(rows);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to bulk import employees');
    }
  }
);

export const fetchOwnerPlatformAnalytics = createAsyncThunk(
  'owner/fetchPlatformAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerPlatformAnalytics();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch platform analytics');
    }
  }
);

export const fetchOwnerInvoices = createAsyncThunk(
  'owner/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerInvoices();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchOwnerPlans = createAsyncThunk(
  'owner/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerPlans();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch plans');
    }
  }
);

export const fetchOwnerDashboardOverview = createAsyncThunk(
  'owner/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerDashboardOverview();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch dashboard overview');
    }
  }
);

const initialState = {
  organizations: [],
  employees: [],
  invoices: [],
  plans: [],
  analytics: null,
  stats: {
    activeOrgs: 0,
    pendingOrgs: 0,
    totalRevenue: 0,
    totalEmployees: 0,
  },
  loading: false,
  error: null,
};

const ownerSlice = createSlice({
  name: 'owner',
  initialState,
  reducers: {
    clearOwnerError: (state) => {
      state.error = null;
    },
    setOwnerOrganizations: (state, action) => {
      state.organizations = action.payload || [];
    },
    setOwnerEmployees: (state, action) => {
      state.employees = action.payload || [];
    },
    setOwnerInvoices: (state, action) => {
      state.invoices = action.payload || [];
    },
    setOwnerPlans: (state, action) => {
      state.plans = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOwnerDashboardOverview
      .addCase(fetchOwnerDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.organizations = action.payload.organizations || [];
          state.employees = action.payload.employees || [];
          state.invoices = action.payload.invoices || [];
          state.stats = action.payload.stats || state.stats;
        }
      })
      .addCase(fetchOwnerDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchOwnerOrganizations
      .addCase(fetchOwnerOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // approveOwnerOrganization
      .addCase(approveOwnerOrganization.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.organizations.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.organizations[index] = { ...state.organizations[index], ...updated };
          }
        }
      })

      // suspendOwnerOrganization
      .addCase(suspendOwnerOrganization.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.organizations.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.organizations[index] = { ...state.organizations[index], ...updated };
          }
        }
      })

      // reactivateOwnerOrganization
      .addCase(reactivateOwnerOrganization.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.organizations.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.organizations[index] = { ...state.organizations[index], ...updated };
          }
        }
      })

      // assignOwnerOrganizationEmployee
      .addCase(assignOwnerOrganizationEmployee.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.organizations.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.organizations[index] = { ...state.organizations[index], ...updated };
          }
        }
      })

      // fetchOwnerEmployees
      .addCase(fetchOwnerEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createOwnerEmployee
      .addCase(createOwnerEmployee.fulfilled, (state, action) => {
        if (action.payload) {
          state.employees.push(action.payload);
        }
      })

      // updateOwnerEmployee
      .addCase(updateOwnerEmployee.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.employees.findIndex((e) => e.id === updated.id);
          if (index !== -1) {
            state.employees[index] = { ...state.employees[index], ...updated };
          }
        }
      })

      // removeOwnerEmployee
      .addCase(removeOwnerEmployee.fulfilled, (state, action) => {
        const { id, unassignedOrganizations = [] } = action.payload || {};
        if (id) {
          state.employees = state.employees.filter((e) => e.id !== id);
        }
        if (Array.isArray(unassignedOrganizations) && unassignedOrganizations.length > 0) {
          const unassignedIds = new Set(unassignedOrganizations.map((o) => o.id));
          state.organizations = state.organizations.map((org) =>
            unassignedIds.has(org.id) ? { ...org, assignedEmployeeId: null } : org
          );
        }
      })

      // suspendOwnerEmployee
      .addCase(suspendOwnerEmployee.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.employees.findIndex((e) => e.id === updated.id);
          if (index !== -1) {
            state.employees[index] = { ...state.employees[index], ...updated };
          }
        }
      })

      // reactivateOwnerEmployee
      .addCase(reactivateOwnerEmployee.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.employees.findIndex((e) => e.id === updated.id);
          if (index !== -1) {
            state.employees[index] = { ...state.employees[index], ...updated };
          }
        }
      })

      // fetchOwnerPlatformAnalytics
      .addCase(fetchOwnerPlatformAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload || null;
      })

      // fetchOwnerInvoices
      .addCase(fetchOwnerInvoices.fulfilled, (state, action) => {
        state.invoices = Array.isArray(action.payload) ? action.payload : [];
      })

      // fetchOwnerPlans
      .addCase(fetchOwnerPlans.fulfilled, (state, action) => {
        state.plans = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const {
  clearOwnerError,
  setOwnerOrganizations,
  setOwnerEmployees,
  setOwnerInvoices,
  setOwnerPlans,
} = ownerSlice.actions;

// Selectors
export const selectOwnerOrganizations = (state) => state.owner?.organizations || [];
export const selectOwnerEmployees = (state) => state.owner?.employees || [];
export const selectOwnerInvoices = (state) => state.owner?.invoices || [];
export const selectOwnerPlans = (state) => state.owner?.plans || [];
export const selectOwnerAnalytics = (state) => state.owner?.analytics || null;
export const selectOwnerStats = (state) => state.owner?.stats || initialState.stats;
export const selectOwnerLoading = (state) => state.owner?.loading || false;
export const selectOwnerError = (state) => state.owner?.error || null;

export default ownerSlice.reducer;
