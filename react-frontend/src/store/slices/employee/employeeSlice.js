import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as employeeService from '../../../services/employee';
import { logout } from '../auth/authSlice';

/**
 * Platform Employee Async Thunks
 * Assigned to: Person 6
 */

export const fetchEmployeeDashboardOverview = createAsyncThunk(
  'employee/fetchDashboardOverview',
  async (employeeId, { rejectWithValue }) => {
    try {
      return await employeeService.fetchEmployeeDashboardOverview(employeeId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load employee dashboard overview');
    }
  }
);

export const fetchEmployeeInstitutions = createAsyncThunk(
  'employee/fetchInstitutions',
  async (employeeId, { rejectWithValue }) => {
    try {
      const data = await employeeService.fetchEmployeeInstitutions(employeeId);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch institutions');
    }
  }
);

export const suspendEmployeeInstitution = createAsyncThunk(
  'employee/suspendInstitution',
  async (id, { rejectWithValue }) => {
    try {
      const result = await employeeService.suspendEmployeeInstitution(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend institution');
    }
  }
);

export const reactivateEmployeeInstitution = createAsyncThunk(
  'employee/reactivateInstitution',
  async (id, { rejectWithValue }) => {
    try {
      const result = await employeeService.reactivateEmployeeInstitution(id);
      return { id, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate institution');
    }
  }
);

export const fetchEmployeeTickets = createAsyncThunk(
  'employee/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      const data = await employeeService.fetchEmployeeTickets();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch support tickets');
    }
  }
);

export const resolveEmployeeTicket = createAsyncThunk(
  'employee/resolveTicket',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'object' ? payload.id : payload;
      const reply = typeof payload === 'object' ? payload.reply : arguments[1];
      const result = await employeeService.resolveEmployeeTicket(id, reply);
      return { id, reply, result };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to resolve ticket');
    }
  }
);

export const fetchEmployeeAnnouncements = createAsyncThunk(
  'employee/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const data = await employeeService.fetchEmployeeAnnouncements();
      return data || [];
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

// Initial State
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
  overviewLoading: false,
  institutionsLoading: false,
  ticketsLoading: false,
  announcementsLoading: false,
  operationLoading: false,
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
    resetEmployeeState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // 1. Overview
      .addCase(fetchEmployeeDashboardOverview.pending, (state) => {
        state.overviewLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDashboardOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.loading = false;
        if (action.payload) {
          state.institutions = action.payload.institutions || [];
          state.tickets = action.payload.tickets || [];
          state.announcements = action.payload.announcements || [];
          state.stats = action.payload.stats || state.stats;
        }
      })
      .addCase(fetchEmployeeDashboardOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      // 2. Institutions
      .addCase(fetchEmployeeInstitutions.pending, (state) => {
        state.institutionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeInstitutions.fulfilled, (state, action) => {
        state.institutionsLoading = false;
        state.loading = false;
        state.institutions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeInstitutions.rejected, (state, action) => {
        state.institutionsLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(suspendEmployeeInstitution.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(suspendEmployeeInstitution.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const inst = state.institutions.find((i) => i.id === id);
        if (inst) {
          inst.status = 'Suspended';
        }
      })
      .addCase(suspendEmployeeInstitution.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      .addCase(reactivateEmployeeInstitution.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(reactivateEmployeeInstitution.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id } = action.payload;
        const inst = state.institutions.find((i) => i.id === id);
        if (inst) {
          inst.status = 'Active';
        }
      })
      .addCase(reactivateEmployeeInstitution.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      // 3. Tickets
      .addCase(fetchEmployeeTickets.pending, (state) => {
        state.ticketsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.loading = false;
        state.tickets = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeTickets.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resolveEmployeeTicket.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(resolveEmployeeTicket.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { id, reply } = action.payload;
        const ticket = state.tickets.find((t) => t.id === id);
        if (ticket) {
          ticket.status = 'Resolved';
          ticket.reply = reply;
        }
        if (state.stats) {
          state.stats.openTickets = Math.max(0, (state.stats.openTickets || 1) - 1);
          state.stats.resolvedTickets = (state.stats.resolvedTickets || 0) + 1;
        }
      })
      .addCase(resolveEmployeeTicket.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      // 4. Announcements
      .addCase(fetchEmployeeAnnouncements.pending, (state) => {
        state.announcementsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeAnnouncements.fulfilled, (state, action) => {
        state.announcementsLoading = false;
        state.loading = false;
        state.announcements = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployeeAnnouncements.rejected, (state, action) => {
        state.announcementsLoading = false;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createEmployeeAnnouncement.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(createEmployeeAnnouncement.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (action.payload) {
          state.announcements.push(action.payload);
        }
        if (state.stats) {
          state.stats.announcementsSent = (state.stats.announcementsSent || 0) + 1;
        }
      })
      .addCase(createEmployeeAnnouncement.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })

      // Reset state on auth logout
      .addCase(logout, () => initialState);
  },
});

export const { clearEmployeeError, resetEmployeeState } = employeeSlice.actions;

// Selectors
export const selectEmployeeState = (state) => state?.employee || initialState;
export const selectEmployeeInstitutions = (state) => selectEmployeeState(state)?.institutions || [];
export const selectEmployeeTickets = (state) => selectEmployeeState(state)?.tickets || [];
export const selectEmployeeAnnouncements = (state) => selectEmployeeState(state)?.announcements || [];
export const selectEmployeeStats = (state) => selectEmployeeState(state)?.stats || initialState.stats;
export const selectEmployeeLoading = (state) => selectEmployeeState(state)?.loading || false;
export const selectEmployeeOverviewLoading = (state) => selectEmployeeState(state)?.overviewLoading || false;
export const selectEmployeeInstitutionsLoading = (state) => selectEmployeeState(state)?.institutionsLoading || false;
export const selectEmployeeTicketsLoading = (state) => selectEmployeeState(state)?.ticketsLoading || false;
export const selectEmployeeAnnouncementsLoading = (state) => selectEmployeeState(state)?.announcementsLoading || false;
export const selectEmployeeOperationLoading = (state) => selectEmployeeState(state)?.operationLoading || false;
export const selectEmployeeError = (state) => selectEmployeeState(state)?.error || null;

export default employeeSlice.reducer;
