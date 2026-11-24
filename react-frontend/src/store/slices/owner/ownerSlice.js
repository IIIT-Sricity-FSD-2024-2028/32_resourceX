import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as ownerService from '../../../services/owner';

/**
 * Platform Owner Async Thunks
 * Assigned to: Person 6
 */

export const fetchOwnerDashboardOverview = createAsyncThunk(
  'owner/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await ownerService.fetchOwnerDashboardOverview();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load dashboard overview');
    }
  }
);

export const fetchOwnerOrganizations = createAsyncThunk(
  'owner/fetchOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const data = await ownerService.fetchOwnerOrganizations();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch organizations');
    }
  }
);

export const approveOwnerOrganization = createAsyncThunk(
  'owner/approveOrganization',
  async (payload, { rejectWithValue }) => {
    try {
      const orgId = typeof payload === 'object' ? (payload.id || payload.orgId) : payload;
      const employeeId = typeof payload === 'object' ? payload.employeeId : undefined;
      const result = await ownerService.approveOwnerOrganization(orgId, employeeId);
      return { id: orgId, employeeId, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve organization');
    }
  }
);

export const suspendOwnerOrganization = createAsyncThunk(
  'owner/suspendOrganization',
  async (id, { rejectWithValue }) => {
    try {
      const result = await ownerService.suspendOwnerOrganization(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend organization');
    }
  }
);

export const reactivateOwnerOrganization = createAsyncThunk(
  'owner/reactivateOrganization',
  async (id, { rejectWithValue }) => {
    try {
      const result = await ownerService.reactivateOwnerOrganization(id);
      return { id, result };
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
      const result = await ownerService.assignOwnerOrganizationEmployee(orgId, employeeId);
      return { orgId, employeeId, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to assign employee to organization');
    }
  }
);

export const fetchOwnerEmployees = createAsyncThunk(
  'owner/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const data = await ownerService.fetchOwnerEmployees();
      return data || [];
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

export const updateOwnerEmployee = createAsyncThunk(
  'owner/updateEmployee',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const result = await ownerService.updateOwnerEmployee(id, payload);
      return { id, payload, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update employee');
    }
  }
);

export const removeOwnerEmployee = createAsyncThunk(
  'owner/removeEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const result = await ownerService.removeOwnerEmployee(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to remove employee');
    }
  }
);

export const suspendOwnerEmployee = createAsyncThunk(
  'owner/suspendEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const result = await ownerService.suspendOwnerEmployee(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend employee');
    }
  }
);

export const reactivateOwnerEmployee = createAsyncThunk(
  'owner/reactivateEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const result = await ownerService.reactivateOwnerEmployee(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate employee');
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
      const data = await ownerService.fetchOwnerInvoices();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchOwnerPlans = createAsyncThunk(
  'owner/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const data = await ownerService.fetchOwnerPlans();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch subscription plans');
    }
  }
);

// Initial State
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
  overviewLoading: false,
  organizationsLoading: false,
  employeesLoading: false,
  invoicesLoading: false,
  plansLoading: false,
  operationLoading: false,
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
    resetOwnerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // 1. Overview
      .addCase(fetchOwnerDashboardOverview.pending, (state) => {
        state.overviewLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerDashboardOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.loading = false;
        if (action.payload) {
          state.organizations = action.payload.organizations || [];
          state.employees = action.payload.employees || [];
          state.invoices = action.payload.invoices || [];
          state.stats = action.payload.stats || state.stats;
        }
      })
      .addCase(fetchOwnerDashboardOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      // 2. Organizations
      .addCase(fetchOwnerOrganizations.pending, (state) => {
        state.organizationsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerOrganizations.fulfilled, (state, action) => {
        state.organizationsLoading = false;
        state.loading = false;
        state.organizations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerOrganizations.rejected, (state, action) => {
        state.organizationsLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      // 3. Organization Actions
      .addCase(approveOwnerOrganization.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(approveOwnerOrganization.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id, employeeId } = action.payload;
        const org = state.organizations.find((o) => o.id === id);
        if (org) {
          org.status = 'Active';
          if (employeeId) org.assignedEmployeeId = employeeId;
        }
      })
      .addCase(approveOwnerOrganization.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(suspendOwnerOrganization.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(suspendOwnerOrganization.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const org = state.organizations.find((o) => o.id === id);
        if (org) {
          org.status = 'Suspended';
        }
      })
      .addCase(suspendOwnerOrganization.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(reactivateOwnerOrganization.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(reactivateOwnerOrganization.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const org = state.organizations.find((o) => o.id === id);
        if (org) {
          org.status = 'Active';
        }
      })
      .addCase(reactivateOwnerOrganization.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(assignOwnerOrganizationEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(assignOwnerOrganizationEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { orgId, employeeId } = action.payload;
        const org = state.organizations.find((o) => o.id === orgId);
        if (org) {
          org.assignedEmployeeId = employeeId;
        }
      })
      .addCase(assignOwnerOrganizationEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      // 4. Employees
      .addCase(fetchOwnerEmployees.pending, (state) => {
        state.employeesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerEmployees.fulfilled, (state, action) => {
        state.employeesLoading = false;
        state.loading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerEmployees.rejected, (state, action) => {
        state.employeesLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createOwnerEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(createOwnerEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (action.payload) {
          state.employees.push(action.payload);
        }
      })
      .addCase(createOwnerEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(bulkCreateOwnerEmployees.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(bulkCreateOwnerEmployees.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (Array.isArray(action.payload?.created)) {
          state.employees = [...state.employees, ...action.payload.created];
        }
      })
      .addCase(bulkCreateOwnerEmployees.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(updateOwnerEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateOwnerEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id, payload } = action.payload;
        const idx = state.employees.findIndex((e) => e.id === id);
        if (idx !== -1) {
          state.employees[idx] = { ...state.employees[idx], ...payload };
        }
        if (payload?.organizationIds && Array.isArray(payload.organizationIds)) {
          state.organizations.forEach((org) => {
            if (payload.organizationIds.includes(org.id)) {
              org.assignedEmployeeId = id;
            } else if (org.assignedEmployeeId === id) {
              org.assignedEmployeeId = null;
            }
          });
        }
      })
      .addCase(updateOwnerEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(removeOwnerEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(removeOwnerEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        state.employees = state.employees.filter((e) => e.id !== id);
        state.organizations.forEach((org) => {
          if (org.assignedEmployeeId === id) {
            org.assignedEmployeeId = null;
          }
        });
      })
      .addCase(removeOwnerEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(suspendOwnerEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(suspendOwnerEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const emp = state.employees.find((e) => e.id === id);
        if (emp) {
          emp.status = 'Suspended';
        }
      })
      .addCase(suspendOwnerEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(reactivateOwnerEmployee.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(reactivateOwnerEmployee.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const emp = state.employees.find((e) => e.id === id);
        if (emp) {
          emp.status = 'Active';
        }
      })
      .addCase(reactivateOwnerEmployee.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      // 5. Invoices & Plans
      .addCase(fetchOwnerInvoices.pending, (state) => {
        state.invoicesLoading = true;
      })
      .addCase(fetchOwnerInvoices.fulfilled, (state, action) => {
        state.invoicesLoading = false;
        state.invoices = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerInvoices.rejected, (state, action) => {
        state.invoicesLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchOwnerPlans.pending, (state) => {
        state.plansLoading = true;
      })
      .addCase(fetchOwnerPlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOwnerPlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchOwnerPlatformAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload || null;
      });
  },
});

export const { clearOwnerError, resetOwnerState } = ownerSlice.actions;

// Selectors
export const selectOwnerState = (state) => state?.owner || initialState;
export const selectOwnerOrganizations = (state) => selectOwnerState(state)?.organizations || [];
export const selectOwnerEmployees = (state) => selectOwnerState(state)?.employees || [];
export const selectOwnerInvoices = (state) => selectOwnerState(state)?.invoices || [];
export const selectOwnerPlans = (state) => selectOwnerState(state)?.plans || [];
export const selectOwnerStats = (state) => selectOwnerState(state)?.stats || initialState.stats;
export const selectOwnerLoading = (state) => selectOwnerState(state)?.loading || false;
export const selectOwnerOverviewLoading = (state) => selectOwnerState(state)?.overviewLoading || false;
export const selectOwnerOrganizationsLoading = (state) => selectOwnerState(state)?.organizationsLoading || false;
export const selectOwnerEmployeesLoading = (state) => selectOwnerState(state)?.employeesLoading || false;
export const selectOwnerPlansLoading = (state) => selectOwnerState(state)?.plansLoading || false;
export const selectOwnerOperationLoading = (state) => selectOwnerState(state)?.operationLoading || false;
export const selectOwnerError = (state) => selectOwnerState(state)?.error || null;

export default ownerSlice.reducer;
