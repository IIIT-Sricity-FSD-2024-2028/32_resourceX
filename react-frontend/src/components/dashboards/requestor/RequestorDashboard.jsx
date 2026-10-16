import React, { useState, useCallback } from 'react';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { useAuth } from '../../../context/AuthContext';
import AdminToast from '../admin/components/AdminToast';
import FilePreviewModal from './components/FilePreviewModal';

import RequestorOverview from './views/RequestorOverview';
import RequestResourceView from './views/RequestResourceView';
import MyRequestsView from './views/MyRequestsView';
import MyResourcesView from './views/MyResourcesView';

import './requestor.css';

/**
 * Navigation items matching requestor.html nav-menu:
 * 1. Dashboard
 * 2. Request Resource
 * 3. My Requests
 * 4. My Resources
 * 5. Procurement
 */
const REQUESTOR_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'request', label: 'Request Resource', icon: 'add_circle' },
  { id: 'my-requests', label: 'My Requests', icon: 'list_alt' },
  { id: 'my-resources', label: 'My Resources', icon: 'inventory_2' }
];

export default function RequestorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handlePreviewFile = useCallback((fileObj) => {
    if (!fileObj || !fileObj.dataUrl) {
      addToast('File preview is not available.', 'error');
      return;
    }
    setPreviewFile(fileObj);
  }, [addToast]);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Universal Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        customNavItems={REQUESTOR_NAV_ITEMS}
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <AppHeader />

        {/* Content Area */}
        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
            {activeTab === 'dashboard' && (
              <RequestorOverview
                onSwitchView={handleTabChange}
                addToast={addToast}
              />
            )}

            {activeTab === 'request' && (
              <RequestResourceView
                addToast={addToast}
                onNavigateToRequests={() => handleTabChange('my-requests')}
              />
            )}

            {activeTab === 'my-requests' && (
              <MyRequestsView
                addToast={addToast}
                onNavigateToResources={() => handleTabChange('my-resources')}
              />
            )}

            {activeTab === 'my-resources' && (
              <MyResourcesView
                addToast={addToast}
                onPreviewFile={handlePreviewFile}
              />
            )}


          </div>
        </main>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Toast Notifications */}
      <AdminToast toasts={toasts} />
    </div>
  );
}
