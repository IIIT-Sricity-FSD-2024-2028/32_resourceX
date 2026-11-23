import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminService from '../../../services/admin';

// ========================================================
// Async Thunks - System Admin Module (Person 2)
// ========================================================

export const fetchAdminOverview = createAsyncThunk(
  'admin/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.fetchAdminDashboardOverview();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load dashboard overview');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchAdminUsers();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      return await adminService.createAdminUser(userData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await adminService.updateAdminUser(id, updates);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update user');
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'admin/deactivateUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deactivateAdminUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to deactivate user');
    }
  }
);

export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async (id, { rejectWithValue }) => {
    try {
      return await adminService.suspendAdminUser(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to suspend user');
    }
  }
);

export const reactivateUser = createAsyncThunk(
  'admin/reactivateUser',
  async (id, { rejectWithValue }) => {
    try {
      return await adminService.reactivateAdminUser(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reactivate user');
    }
  }
);

export const bulkCreateUsers = createAsyncThunk(
  'admin/bulkCreateUsers',
  async (rows, { rejectWithValue }) => {
    try {
      return await adminService.bulkCreateAdminUsers(rows);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to bulk import users');
    }
  }
);

export const fetchDepartments = createAsyncThunk(
  'admin/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchAdminDepartments();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch departments');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'admin/createDepartment',
  async (deptData, { rejectWithValue }) => {
    try {
      return await adminService.createAdminDepartment(deptData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'admin/updateDepartment',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await adminService.updateAdminDepartment(id, updates);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update department');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'admin/deleteDepartment',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteAdminDepartment(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete department');
    }
  }
);

export const fetchCatalog = createAsyncThunk(
  'admin/fetchCatalog',
  async (params, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchResourceCatalog(params);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch catalog');
    }
  }
);

export const updateCatalog = createAsyncThunk(
  'admin/updateCatalog',
  async ({ department, resourceTypes }, { rejectWithValue }) => {
    try {
      await adminService.updateResourceCatalog(department, resourceTypes);
      return { department, resourceTypes };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update catalog');
    }
  }
);

export const fetchSupportTickets = createAsyncThunk(
  'admin/fetchSupportTickets',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchAdminSupportTickets();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch support tickets');
    }
  }
);

export const createSupportTicket = createAsyncThunk(
  'admin/createSupportTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      return await adminService.createAdminSupportTicket(ticketData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create support ticket');
    }
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'admin/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchAdminAnnouncements();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch announcements');
    }
  }
);

export const replyAnnouncement = createAsyncThunk(
  'admin/replyAnnouncement',
  async ({ id, replyText }, { rejectWithValue }) => {
    try {
      await adminService.replyToAnnouncement(id, replyText);
      return { id, reply: replyText };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to send announcement reply');
    }
  }
);

export const fetchOrganization = createAsyncThunk(
  'admin/fetchOrganization',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.fetchAdminOrganization();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch organization details');
    }
  }
);

export const fetchPlans = createAsyncThunk(
  'admin/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchSubscriptionPlans();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch subscription plans');
    }
  }
);

export const changeSubscription = createAsyncThunk(
  'admin/changeSubscription',
  async (planId, { rejectWithValue }) => {
    try {
      await adminService.updateSubscription(planId);
      return planId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update subscription');
    }
  }
);

// Compatibility aliases matching team lead's thunk naming
export const fetchAdminUsers = fetchUsers;
export const createAdminUser = createUser;
export const updateAdminUser = updateUser;
export const fetchAdminDepartments = fetchDepartments;
export const createAdminDepartment = createDepartment;
export const fetchAdminSupportTickets = fetchSupportTickets;
export const fetchAdminAnnouncements = fetchAnnouncements;

// ========================================================
// Initial State
// ========================================================

const initialState = {
  // Overview & Metrics
  overview: {
    stats: {
      totalUsers: 0,
      totalDepartments: 0,
      totalResources: 0,
      pendingRequests: 0,
      openTickets: 0,
      activeAnnouncements: 0,
    },
    users: [],
    departments: [],
    resources: [],
    requests: [],
    supportTickets: [],
    announcements: [],
  },
  overviewLoading: false,
  overviewError: null,

  // Users State
  users: [],
  usersLoading: false,
  usersError: null,
  userOperationLoading: false,
  userOperationError: null,

  // Departments & Catalog State
  departments: [],
  catalog: [],
  departmentsLoading: false,
  departmentsError: null,
  catalogLoading: false,
  deptOperationLoading: false,
  deptOperationError: null,

  // Support Tickets State
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  ticketOperationLoading: false,
  ticketOperationError: null,

  // Announcements State
  announcements: [],
  announcementsLoading: false,
  announcementsError: null,
  announcementOperationLoading: false,
  announcementOperationError: null,

  // Organization & Subscription State
  organization: null,
  orgLoading: false,
  orgError: null,
  plans: [],
  plansLoading: false,
  plansError: null,
  subOperationLoading: false,
  subOperationError: null,

  // Active Selections for Modals
  selectedUser: null,
  selectedDepartment: null,
  selectedTicket: null,
  selectedAnnouncement: null,
};

// ========================================================
// Admin Slice Definition
// ========================================================

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload || null;
    },
    setSelectedDepartment: (state, action) => {
      state.selectedDepartment = action.payload || null;
    },
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload || null;
    },
    setSelectedAnnouncement: (state, action) => {
      state.selectedAnnouncement = action.payload || null;
    },
    clearAdminErrors: (state) => {
      state.overviewError = null;
      state.usersError = null;
      state.userOperationError = null;
      state.departmentsError = null;
      state.deptOperationError = null;
      state.ticketsError = null;
      state.ticketOperationError = null;
      state.announcementsError = null;
      state.announcementOperationError = null;
      state.orgError = null;
      state.plansError = null;
      state.subOperationError = null;
    },
    resetAdminState: () => initialState,
  },
  extraReducers: (builder) => {
    // --- 1. Admin Overview ---
    builder
      .addCase(fetchAdminOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload || initialState.overview;
        if (action.payload?.users) {
          state.users = action.payload.users;
        }
        if (action.payload?.departments) {
          state.departments = action.payload.departments;
        }
      })
      .addCase(fetchAdminOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.payload || 'Failed to load admin overview';
      });

    // --- 2. Users ---
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload || [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload || 'Failed to fetch users';
      })
      .addCase(createUser.pending, (state) => {
        state.userOperationLoading = true;
        state.userOperationError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        if (action.payload) {
          state.users.push(action.payload);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload || 'Failed to create user';
      })
      .addCase(updateUser.pending, (state) => {
        state.userOperationLoading = true;
        state.userOperationError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        if (action.payload?.id) {
          const index = state.users.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) {
            state.users[index] = { ...state.users[index], ...action.payload };
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload || 'Failed to update user';
      })
      .addCase(deactivateUser.pending, (state) => {
        state.userOperationLoading = true;
        state.userOperationError = null;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload);
        if (index !== -1) {
          state.users[index].status = 'Inactive';
        }
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload || 'Failed to deactivate user';
      })
      .addCase(suspendUser.pending, (state) => {
        state.userOperationLoading = true;
      })
      .addCase(suspendUser.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        if (action.payload?.id) {
          const index = state.users.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) {
            state.users[index] = { ...state.users[index], ...action.payload };
          }
        }
      })
      .addCase(suspendUser.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload;
      })
      .addCase(reactivateUser.pending, (state) => {
        state.userOperationLoading = true;
      })
      .addCase(reactivateUser.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        if (action.payload?.id) {
          const index = state.users.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) {
            state.users[index] = { ...state.users[index], ...action.payload };
          }
        }
      })
      .addCase(reactivateUser.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload;
      })
      .addCase(bulkCreateUsers.pending, (state) => {
        state.userOperationLoading = true;
        state.userOperationError = null;
      })
      .addCase(bulkCreateUsers.fulfilled, (state, action) => {
        state.userOperationLoading = false;
        if (Array.isArray(action.payload?.created)) {
          state.users = [...state.users, ...action.payload.created];
        }
      })
      .addCase(bulkCreateUsers.rejected, (state, action) => {
        state.userOperationLoading = false;
        state.userOperationError = action.payload || 'Bulk import failed';
      });

    // --- 3. Departments & Catalog ---
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.departmentsError = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departments = action.payload || [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsLoading = false;
        state.departmentsError = action.payload || 'Failed to fetch departments';
      })
      .addCase(createDepartment.pending, (state) => {
        state.deptOperationLoading = true;
        state.deptOperationError = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.deptOperationLoading = false;
        if (action.payload) {
          state.departments.push(action.payload);
        }
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.deptOperationLoading = false;
        state.deptOperationError = action.payload || 'Failed to create department';
      })
      .addCase(updateDepartment.pending, (state) => {
        state.deptOperationLoading = true;
        state.deptOperationError = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.deptOperationLoading = false;
        if (action.payload?.id) {
          const index = state.departments.findIndex((d) => d.id === action.payload.id);
          if (index !== -1) {
            state.departments[index] = { ...state.departments[index], ...action.payload };
          }
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.deptOperationLoading = false;
        state.deptOperationError = action.payload || 'Failed to update department';
      })
      .addCase(deleteDepartment.pending, (state) => {
        state.deptOperationLoading = true;
        state.deptOperationError = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.deptOperationLoading = false;
        state.departments = state.departments.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.deptOperationLoading = false;
        state.deptOperationError = action.payload || 'Failed to delete department';
      })
      .addCase(fetchCatalog.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.catalog = action.payload || [];
      })
      .addCase(fetchCatalog.rejected, (state) => {
        state.catalogLoading = false;
      })
      .addCase(updateCatalog.pending, (state) => {
        state.deptOperationLoading = true;
      })
      .addCase(updateCatalog.fulfilled, (state, action) => {
        state.deptOperationLoading = false;
        const { department, resourceTypes } = action.payload;
        const index = state.catalog.findIndex((c) => c.department === department);
        if (index !== -1) {
          state.catalog[index].resourceTypes = resourceTypes;
        } else {
          state.catalog.push({ department, resourceTypes });
        }
      })
      .addCase(updateCatalog.rejected, (state, action) => {
        state.deptOperationLoading = false;
        state.deptOperationError = action.payload;
      });

    // --- 4. Support Tickets ---
    builder
      .addCase(fetchSupportTickets.pending, (state) => {
        state.ticketsLoading = true;
        state.ticketsError = null;
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload || [];
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.ticketsError = action.payload || 'Failed to fetch tickets';
      })
      .addCase(createSupportTicket.pending, (state) => {
        state.ticketOperationLoading = true;
        state.ticketOperationError = null;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.ticketOperationLoading = false;
        if (action.payload) {
          state.tickets.push(action.payload);
        }
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.ticketOperationLoading = false;
        state.ticketOperationError = action.payload || 'Failed to create ticket';
      });

    // --- 5. Announcements ---
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.announcementsLoading = true;
        state.announcementsError = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcementsLoading = false;
        state.announcements = action.payload || [];
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.announcementsLoading = false;
        state.announcementsError = action.payload || 'Failed to fetch announcements';
      })
      .addCase(replyAnnouncement.pending, (state) => {
        state.announcementOperationLoading = true;
        state.announcementOperationError = null;
      })
      .addCase(replyAnnouncement.fulfilled, (state, action) => {
        state.announcementOperationLoading = false;
        const { id, reply } = action.payload;
        const index = state.announcements.findIndex((a) => a.id === id);
        if (index !== -1) {
          state.announcements[index] = {
            ...state.announcements[index],
            reply,
            adminReply: reply
          };
        }
      })
      .addCase(replyAnnouncement.rejected, (state, action) => {
        state.announcementOperationLoading = false;
        state.announcementOperationError = action.payload || 'Failed to reply to announcement';
      });

    // --- 6. Organization ---
    builder
      .addCase(fetchOrganization.pending, (state) => {
        state.orgLoading = true;
        state.orgError = null;
      })
      .addCase(fetchOrganization.fulfilled, (state, action) => {
        state.orgLoading = false;
        state.organization = action.payload || null;
      })
      .addCase(fetchOrganization.rejected, (state, action) => {
        state.orgLoading = false;
        state.orgError = action.payload || 'Failed to fetch organization';
      });

    // --- 7. Subscription Plans & Upgrade ---
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.plansLoading = true;
        state.plansError = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = action.payload || [];
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.plansError = action.payload || 'Failed to fetch subscription plans';
      })
      .addCase(changeSubscription.pending, (state) => {
        state.subOperationLoading = true;
        state.subOperationError = null;
      })
      .addCase(changeSubscription.fulfilled, (state, action) => {
        state.subOperationLoading = false;
        if (state.organization) {
          state.organization.subscriptionPlanId = action.payload;
        }
      })
      .addCase(changeSubscription.rejected, (state, action) => {
        state.subOperationLoading = false;
        state.subOperationError = action.payload || 'Failed to update subscription';
      });
  },
});

export const {
  setSelectedUser,
  setSelectedDepartment,
  setSelectedTicket,
  setSelectedAnnouncement,
  clearAdminErrors,
  resetAdminState
} = adminSlice.actions;

// ========================================================
// Selectors
// ========================================================

export const selectAdminState = (state) => state?.admin || initialState;

export const selectAdminOverview = (state) => selectAdminState(state)?.overview || initialState.overview;
export const selectAdminOverviewLoading = (state) => selectAdminState(state)?.overviewLoading || false;
export const selectAdminOverviewError = (state) => selectAdminState(state)?.overviewError || null;

export const selectAdminUsers = (state) => selectAdminState(state)?.users || [];
export const selectAdminUsersLoading = (state) => selectAdminState(state)?.usersLoading || false;
export const selectAdminUsersError = (state) => selectAdminState(state)?.usersError || null;
export const selectUserOperationLoading = (state) => selectAdminState(state)?.userOperationLoading || false;
export const selectUserOperationError = (state) => selectAdminState(state)?.userOperationError || null;

export const selectAdminDepartments = (state) => selectAdminState(state)?.departments || [];
export const selectAdminCatalog = (state) => selectAdminState(state)?.catalog || [];
export const selectAdminDeptsLoading = (state) => selectAdminState(state)?.departmentsLoading || false;
export const selectAdminDeptsError = (state) => selectAdminState(state)?.departmentsError || null;
export const selectDeptOperationLoading = (state) => selectAdminState(state)?.deptOperationLoading || false;

export const selectAdminTickets = (state) => selectAdminState(state)?.tickets || [];
export const selectAdminTicketsLoading = (state) => selectAdminState(state)?.ticketsLoading || false;
export const selectAdminTicketsError = (state) => selectAdminState(state)?.ticketsError || null;
export const selectTicketOperationLoading = (state) => selectAdminState(state)?.ticketOperationLoading || false;

export const selectAdminAnnouncements = (state) => selectAdminState(state)?.announcements || [];
export const selectAdminAnnouncementsLoading = (state) => selectAdminState(state)?.announcementsLoading || false;
export const selectAdminAnnouncementsError = (state) => selectAdminState(state)?.announcementsError || null;
export const selectAnnouncementOperationLoading = (state) => selectAdminState(state)?.announcementOperationLoading || false;

export const selectAdminOrganization = (state) => selectAdminState(state)?.organization || null;
export const selectAdminOrgLoading = (state) => selectAdminState(state)?.orgLoading || false;
export const selectAdminPlans = (state) => selectAdminState(state)?.plans || [];
export const selectAdminPlansLoading = (state) => selectAdminState(state)?.plansLoading || false;
export const selectSubOperationLoading = (state) => selectAdminState(state)?.subOperationLoading || false;
export const selectSelectedUser = (state) => selectAdminState(state)?.selectedUser || null;
export const selectSelectedDepartment = (state) => selectAdminState(state)?.selectedDepartment || null;
export const selectSelectedTicket = (state) => selectAdminState(state)?.selectedTicket || null;
export const selectSelectedAnnouncement = (state) => selectAdminState(state)?.selectedAnnouncement || null;

export default adminSlice.reducer;
