import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/authSlice';
import notificationsReducer from './slices/notifications/notificationsSlice';
import adminReducer from './slices/admin/adminSlice';
import requestorReducer from './slices/requestor/requestorSlice';
import deptHeadReducer from './slices/dept-head/deptHeadSlice';
import inventoryOfficerReducer from './slices/inventory-officer/inventoryOfficerSlice';
import maintenanceOfficerReducer from './slices/maintenance-officer/maintenanceOfficerSlice';
import procurementOfficerReducer from './slices/procurement-officer/procurementOfficerSlice';
import registrarReducer from './slices/registrar/registrarSlice';
import ownerReducer from './slices/owner/ownerSlice';
import employeeReducer from './slices/employee/employeeSlice';

/**
 * Central Redux Store (Classic Actor-Slice Architecture)
 * Each actor's slice reducer is mounted under their domain key.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    admin: adminReducer,
    requestor: requestorReducer,
    deptHead: deptHeadReducer,
    inventoryOfficer: inventoryOfficerReducer,
    maintenanceOfficer: maintenanceOfficerReducer,
    procurementOfficer: procurementOfficerReducer,
    registrar: registrarReducer,
    owner: ownerReducer,
    employee: employeeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
