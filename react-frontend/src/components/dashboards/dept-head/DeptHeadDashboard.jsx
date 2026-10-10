import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DeptHeadLayout from './DeptHeadLayout';
import DeptHeadOverview from './views/DeptHeadOverview';
import DeptHeadIncomingRequests from './views/DeptHeadIncomingRequests';
import DeptHeadResources from './views/DeptHeadResources';
import DeptHeadProcurement from './views/DeptHeadProcurement';
import DeptHeadStockMonitoring from './views/DeptHeadStockMonitoring';
import DeptHeadAnalytics from './views/DeptHeadAnalytics';

/**
 * Self-contained Department Head Dashboard with modular sub-routes
 * (same pattern as AdminDashboard so App.jsx stays untouched).
 *
 *   /dashboard/dept-head                 -> Dashboard
 *   /dashboard/dept-head/requests        -> Incoming Requests
 *   /dashboard/dept-head/resources       -> Dept Resources
 *   /dashboard/dept-head/procurement     -> Procurement
 *   /dashboard/dept-head/stock           -> Stock Monitoring
 *   /dashboard/dept-head/analytics       -> Analytics
 */
export default function DeptHeadDashboard() {
  return (
    <Routes>
      <Route element={<DeptHeadLayout />}>
        <Route index element={<DeptHeadOverview />} />
        <Route path="overview" element={<DeptHeadOverview />} />
        <Route path="requests" element={<DeptHeadIncomingRequests />} />
        <Route path="resources" element={<DeptHeadResources />} />
        <Route path="procurement" element={<DeptHeadProcurement />} />
        <Route path="stock" element={<DeptHeadStockMonitoring />} />
        <Route path="analytics" element={<DeptHeadAnalytics />} />
        <Route path="*" element={<Navigate to="/dashboard/dept-head" replace />} />
      </Route>
    </Routes>
  );
}
