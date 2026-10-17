import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';

// 4 Views matching previous registrar.html
import RegistrarOverview from './views/RegistrarOverview';
import ProcurementApprovalsView from './views/ProcurementApprovalsView';
import GlobalRequestsView from './views/GlobalRequestsView';
import SystemAnalyticsView from './views/SystemAnalyticsView';

// Supporting Components
import FilePreviewModal from './components/FilePreviewModal';
import RegistrarToast from './components/RegistrarToast';

/**
 * 4 Exact navigation items from registrar.html:
 * 1. Dashboard
 * 2. Procurement Approvals
 * 3. Global Requests Overview
 * 4. System Analytics
 */
const REGISTRAR_NAV_ITEMS = [
  { id: 'dashboard', target: '/dashboard/registrar', label: 'Dashboard', icon: 'dashboard', isDefault: true },
  { id: 'procurements', target: '/dashboard/registrar/procurements', label: 'Department Indents', icon: 'assignment' },
  { id: 'requests', target: '/dashboard/registrar/requests', label: 'Global Requests Overview', icon: 'visibility' },
  { id: 'analytics', target: '/dashboard/registrar/analytics', label: 'System Analytics', icon: 'analytics' }
];

export default function RegistrarDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Map path to active tab
  const getTabFromPath = useCallback(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/procurements')) return 'procurements';
    if (path.includes('/requests') || path.includes('/overview')) return 'requests';
    if (path.includes('/analytics')) return 'analytics';
    return 'dashboard';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [getTabFromPath]);

  // Tab switching handler
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      if (tabId === 'dashboard') {
        navigate('/dashboard/registrar');
      } else {
        navigate(`/dashboard/registrar/${tabId}`);
      }
    },
    [navigate]
  );

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handlePreviewFile = useCallback((fileObj) => {
    setPreviewFile(fileObj);
  }, []);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 1. Universal Sidebar with exact 4 items */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        customNavItems={REGISTRAR_NAV_ITEMS}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />

        {/* 3. Content Area */}
        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
            <Routes>
              <Route index element={<RegistrarOverview onSwitchView={handleTabChange} />} />
              <Route path="dashboard" element={<RegistrarOverview onSwitchView={handleTabChange} />} />
              <Route
                path="procurements"
                element={<ProcurementApprovalsView addToast={addToast} onPreviewFile={handlePreviewFile} />}
              />
              <Route path="requests" element={<GlobalRequestsView />} />
              <Route path="analytics" element={<SystemAnalyticsView />} />
              <Route path="*" element={<Navigate to="/dashboard/registrar" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Feedback Toast */}
      <RegistrarToast toasts={toasts} />
    </div>
  );
}
