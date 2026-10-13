import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';

// Import Views
import RegistrarOverview from './views/RegistrarOverview';
import ProcurementApprovalsView from './views/ProcurementApprovalsView';
import GlobalRequestsView from './views/GlobalRequestsView';
import AssetTaggingView from './views/AssetTaggingView';
import MasterCatalogView from './views/MasterCatalogView';
import SystemAnalyticsView from './views/SystemAnalyticsView';

// Import Supporting Components
import FilePreviewModal from './components/FilePreviewModal';
import RegistrarToast from './components/RegistrarToast';

/**
 * Navigation items for the Registrar Portal.
 * Maps cleanly to all 6 core functional areas of the University Registrar.
 */
const REGISTRAR_NAV_ITEMS = [
  { id: 'overview', target: '/dashboard/registrar', label: 'Registrar Overview', icon: 'dashboard', isDefault: true },
  { id: 'procurements', target: '/dashboard/registrar/procurements', label: 'Procurement Approvals', icon: 'receipt_long' },
  { id: 'requests', target: '/dashboard/registrar/requests', label: 'Global Requests', icon: 'visibility' },
  { id: 'tagging', target: '/dashboard/registrar/tagging', label: 'RFID Asset Tagging', icon: 'qr_code_scanner' },
  { id: 'catalog', target: '/dashboard/registrar/catalog', label: 'Master Catalog', icon: 'menu_book' },
  { id: 'analytics', target: '/dashboard/registrar/analytics', label: 'System Analytics', icon: 'analytics' }
];

/**
 * RegistrarDashboard
 * Main layout shell for the Registrar role.
 * Encapsulates all sub-routes, navigation state, toast notifications, and file previews.
 */
export default function RegistrarDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current URL pathname
  const getTabFromPath = useCallback(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/procurements')) return 'procurements';
    if (path.includes('/requests')) return 'requests';
    if (path.includes('/tagging')) return 'tagging';
    if (path.includes('/catalog')) return 'catalog';
    if (path.includes('/analytics')) return 'analytics';
    return 'overview';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  // Keep active tab in sync when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [getTabFromPath]);

  // Handle tab switching both locally and in router
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      if (tabId === 'overview') {
        navigate('/dashboard/registrar');
      } else {
        navigate(`/dashboard/registrar/${tabId}`);
      }
    },
    [navigate]
  );

  // Add toast notification
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Handle file preview modal
  const handlePreviewFile = useCallback((fileObj) => {
    setPreviewFile(fileObj);
  }, []);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 1. Universal Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        customNavItems={REGISTRAR_NAV_ITEMS}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <AppHeader />

        {/* 3. Sub-routes content area */}
        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
            <Routes>
              <Route index element={<RegistrarOverview onSwitchView={handleTabChange} addToast={addToast} />} />
              <Route path="overview" element={<RegistrarOverview onSwitchView={handleTabChange} addToast={addToast} />} />
              <Route
                path="procurements"
                element={<ProcurementApprovalsView addToast={addToast} onPreviewFile={handlePreviewFile} />}
              />
              <Route path="requests" element={<GlobalRequestsView addToast={addToast} />} />
              <Route path="tagging" element={<AssetTaggingView addToast={addToast} />} />
              <Route path="catalog" element={<MasterCatalogView addToast={addToast} />} />
              <Route path="analytics" element={<SystemAnalyticsView addToast={addToast} />} />
              <Route path="*" element={<Navigate to="/dashboard/registrar" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Toast Notifications */}
      <RegistrarToast toasts={toasts} />
    </div>
  );
}
