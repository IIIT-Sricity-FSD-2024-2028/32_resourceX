import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import OwnerOverview from './views/OwnerOverview';
import OwnerRevenue from './views/OwnerRevenue';
import OwnerOrganizations from './views/OwnerOrganizations';
import OwnerEmployees from './views/OwnerEmployees';
import OwnerCreateEmployee from './views/OwnerCreateEmployee';
import OwnerRegistrations from './views/OwnerRegistrations';

/**
 * Self-contained Owner Dashboard with modular sub-routes.
 * Encapsulates all owner views so App.jsx remains clean and conflict-free.
 */
export default function OwnerDashboard() {
  return (
    <Routes>
      <Route element={<OwnerLayout />}>
        <Route index element={<OwnerOverview />} />
        <Route path="overview" element={<OwnerOverview />} />
        <Route path="revenue" element={<OwnerRevenue />} />
        <Route path="organizations" element={<OwnerOrganizations />} />
        <Route path="employees" element={<OwnerEmployees />} />
        <Route path="create-employee" element={<OwnerCreateEmployee />} />
        <Route path="registrations" element={<OwnerRegistrations />} />
      </Route>
    </Routes>
  );
}
