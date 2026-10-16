import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminOverview from './views/AdminOverview';
import AdminUsers from './views/AdminUsers';
import AdminDepartments from './views/AdminDepartments';
import AdminResources from './views/AdminResources';
import AdminSupport from './views/AdminSupport';
import AdminSubscription from './views/AdminSubscription';
import AdminAnnouncements from './views/AdminAnnouncements';

/**
 * Self-contained Admin Dashboard with modular sub-routes.
 * Encapsulates all admin views so App.jsx remains clean and conflict-free.
 */
export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="subscription" element={<AdminSubscription />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
      </Route>
    </Routes>
  );
}
