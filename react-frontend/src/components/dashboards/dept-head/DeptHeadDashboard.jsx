import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DeptHeadLayout from './DeptHeadLayout';
import IncomingRequests from '../../../pages/dept_head/IncomingRequests';
import StockMonitoring from '../../../pages/dept_head/StockMonitoring';

/**
 * Self-contained Department Head Dashboard with modular sub-routes.
 * Pages live in src/pages/dept_head/ (ported from department_head.html / dept_head.js).
 * Add further Dept Head pages (e.g. procurement) as sibling routes here.
 */
export default function DeptHeadDashboard() {
  return (
    <Routes>
      <Route element={<DeptHeadLayout />}>
        <Route index element={<Navigate to="incoming-requests" replace />} />
        <Route path="incoming-requests" element={<IncomingRequests />} />
        <Route path="stock-monitoring" element={<StockMonitoring />} />
        <Route path="*" element={<Navigate to="/dashboard/dept-head" replace />} />
      </Route>
    </Routes>
  );
}
