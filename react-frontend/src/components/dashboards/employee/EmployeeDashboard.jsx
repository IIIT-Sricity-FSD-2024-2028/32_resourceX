import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeLayout from './EmployeeLayout';
import EmployeeOverview from './views/EmployeeOverview';
import EmployeeSupport from './views/EmployeeSupport';
import EmployeeInstitutions from './views/EmployeeInstitutions';
import EmployeeCommunication from './views/EmployeeCommunication';

/**
 * Self-contained Employee Dashboard with modular sub-routes.
 * Encapsulates all employee views so App.jsx remains clean and conflict-free.
 */
export default function EmployeeDashboard() {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<EmployeeOverview />} />
        <Route path="overview" element={<EmployeeOverview />} />
        <Route path="support" element={<EmployeeSupport />} />
        <Route path="institutions" element={<EmployeeInstitutions />} />
        <Route path="communication" element={<EmployeeCommunication />} />
      </Route>
    </Routes>
  );
}
