import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as employeeService from '../../../services/employee';

/**
 * Platform Employee Async Thunks
 * Assigned to: Person 6 (Platform Employee)
 */

export const fetchEmployeeInstitutions = createAsyncThunk(
  'employee/fetchInstitutions',
  async (employeeId, { rejectWithValue }) => {
    try {
      return await employeeService.fetchEmployeeInstitutions(employeeId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch institutions');
    }
  }
);

export const suspendEmployeeInstitution = createAsyncThunk(
  'employee/suspendInstitution',
  async (id, { rejectWithValue }) => {
    try {
      return await employeeService.suspendEmployeeInstitution(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend institution');
    }
  }
);

export const reactivateEmployeeInstitution = createAsyncThunk(
  'employee/reactivateInstitution',
  async (id, { rejectWithValue }) => {
    try {
      return await employeeService.reactivateEmployeeInstitution(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate institution');
    }
  }
);

export const fetchEmployeeTickets = createAsyncThunk(
  'employee/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.fetchEmployeeTickets();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch tickets');
    }
  }
);

export const resolveEmployeeTicket = createAsyncThunk(
  'employee/resolveTicket',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'object' ? payload.id : payload;
      const reply = typeof payload === 'object' ? payload.reply : undefined;
      return await employeeService.resolveEmployeeTicket(id, reply);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to resolve ticket');
    }
  }
);

export const fetchEmployeeAnnouncements = createAsyncThunk(
  'employee/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.fetchEmployeeAnnouncements();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch announcements');
    }
  }
);

export const createEmployeeAnnouncement = createAsyncThunk(
  'employee/createAnnouncement',
  async (announcementData, { rejectWithValue }) => {
    try {
      return await employeeService.createEmployeeAnnouncement(announcementData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create announcement');
    }
  }
);

export const fetchEmployeeDashboardOverview = createAsyncThunk(
  'employee/fetchDashboardOverview',
  async (employeeId, { rejectWithValue }) => {
    try {
      return await employeeService.fetchEmployeeDashboardOverview(employeeId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch dashboard overview');
    }
  }
);

const initialState = {
  institutions: [],
  tickets: [],
  announcements: [],
  stats: {
    assignedInstitutions: 0,
    openTickets: 0,
    resolvedTickets: 0,
    announcementsSent: 0,
  },
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
    setEmployeeInstitutions: (state, action) => {
      state.institutions = action.payload || [];
    },
    setEmployeeTickets: (state, action) => {
      state.tickets = action.payload || [];
    },
    setEmployeeAnnouncements: (state, action) => {
      state.announcements = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchEmployeeDashboardOverview
      .addCase(fetchEmployeeDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.institutions = action.payload.institutions || [];
          state.tickets = action.payload.tickets || [];
          state.announcements = action.payload.announcements || [];
          state.stats = action.payload.stats || state.stats;
        }
      })
      .addCase(fetchEmployeeDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchEmployeeInstitutions
      .addCase(fetchEmployeeInstitutions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeInstitutions.fulfilled, (state, action) => {
        state.loading = false;
        state.institutions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeInstitutions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // suspendEmployeeInstitution
      .addCase(suspendEmployeeInstitution.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.institutions.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.institutions[index] = { ...state.institutions[index], ...updated };
          }
        }
      })

      // reactivateEmployeeInstitution
      .addCase(reactivateEmployeeInstitution.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.institutions.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            state.institutions[index] = { ...state.institutions[index], ...updated };
          }
        }
      })

      // fetchEmployeeTickets
      .addCase(fetchEmployeeTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // resolveEmployeeTicket
      .addCase(resolveEmployeeTicket.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const index = state.tickets.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.tickets[index] = { ...state.tickets[index], ...updated };
          }
        }
      })

      // fetchEmployeeAnnouncements
      .addCase(fetchEmployeeAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createEmployeeAnnouncement
      .addCase(createEmployeeAnnouncement.fulfilled, (state, action) => {
        if (action.payload) {
          state.announcements.push(action.payload);
        }
      });
  },
});

export const {
  clearEmployeeError,
  setEmployeeInstitutions,
  setEmployeeTickets,
  setEmployeeAnnouncements,
} = employeeSlice.actions;

// Selectors
export const selectEmployeeInstitutions = (state) => state.employee?.institutions || [];
export const selectEmployeeTickets = (state) => state.employee?.tickets || [];
export const selectEmployeeAnnouncements = (state) => state.employee?.announcements || [];
export const selectEmployeeStats = (state) => state.employee?.stats || initialState.stats;
export const selectEmployeeLoading = (state) => state.employee?.loading || false;
export const selectEmployeeError = (state) => state.employee?.error || null;

export default employeeSlice.reducer;
