import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { useAuth } from '../../../context/AuthContext';

import DashboardView from './views/DashboardView';
import AllocationsView from './views/AllocationsView';
import RegistrationView from './views/RegistrationView';
import InventoryView from './views/InventoryView';
import MaintenanceView from './views/MaintenanceView';
import ReturnsView from './views/ReturnsView';
import ProcurementTasksView from './views/ProcurementTasksView';
import FilePreviewModal from './components/FilePreviewModal';
import StaffToast from './components/StaffToast';
import './StaffDashboard.css';

/**
 * 7 Core navigation items matching staff.html and original system specification
 */
const STAFF_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'allocations', label: 'Allocation Requests', icon: 'sync_alt' },
  { id: 'registration', label: 'Resource Registration', icon: 'label' },
  { id: 'manage', label: 'Manage Resources', icon: 'inventory_2' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  { id: 'returns', label: 'Returns', icon: 'assignment_return' },
  { id: 'procurement', label: 'Procurement Tasks', icon: 'assignment' }
];

export default function StaffDashboard() {
  const location = useLocation();
  const { user } = useAuth();

  // Initialize active tab from URL path if applicable
  const getTabFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/allocations') || path.includes('/dispatches')) return 'allocations';
    if (path.includes('/registration')) return 'registration';
    if (path.includes('/manage') || path.includes('/inventory') || path.includes('/stock')) return 'manage';
    if (path.includes('/maintenance') || path.includes('/repairs')) return 'maintenance';
    if (path.includes('/returns')) return 'returns';
    if (path.includes('/procurement')) return 'procurement';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handlePreviewInvoice = useCallback((proc) => {
    if (proc?.invoiceFile) {
      setPreviewFile({
        name: proc.invoiceFileName || `Invoice_${proc.invoice || proc.id}`,
        type: proc.invoiceFileType || 'application/pdf',
        dataUrl: proc.invoiceFile
      });
    } else {
      addToast('No invoice file attached to this purchase record.', 'error');
    }
  }, [addToast]);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Universal Sidebar with Exact 7 Staff Operations Tabs */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customNavItems={STAFF_NAV_ITEMS}
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
            {activeTab === 'dashboard' && (
              <DashboardView onSwitchView={setActiveTab} addToast={addToast} />
            )}

            {activeTab === 'allocations' && (
              <AllocationsView addToast={addToast} />
            )}

            {activeTab === 'registration' && (
              <RegistrationView
                addToast={addToast}
                onRegistrationComplete={() => {}}
                onPreviewInvoice={handlePreviewInvoice}
              />
            )}

            {activeTab === 'manage' && (
              <InventoryView
                addToast={addToast}
                onPreviewInvoice={handlePreviewInvoice}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceView addToast={addToast} />
            )}

            {activeTab === 'returns' && (
              <ReturnsView addToast={addToast} />
            )}

            {activeTab === 'procurement' && (
              <ProcurementTasksView
                addToast={addToast}
                onProcurementLogged={() => setActiveTab('registration')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Invoice Attachment Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Toast Notifications */}
      <StaffToast toasts={toasts} />
    </div>
  );
}
