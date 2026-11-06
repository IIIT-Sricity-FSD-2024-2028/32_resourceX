import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import AdminToast from '../admin/components/AdminToast';
import FilePreviewModal from './components/FilePreviewModal';
import './deptHead.css';

/**
 * Layout shell from department_head.html (same structure as AdminLayout)
 * Hosts Sidebar, Top Header, and sub-routes rendered in content-area.
 */
export default function DeptHeadLayout() {
  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  /**
   * Open an attachment. kind = 'spec' | 'invoice' (procurements) | 'letter' (resource requests)
   */
  const openProcurementFile = useCallback(
    (record, kind = 'spec') => {
      const name = record?.[`${kind}FileName`];
      const type = record?.[`${kind}FileType`];
      const dataUrl = record?.[`${kind}FileDataUrl`];
      if (!name) return;
      if (!dataUrl) {
        addToast('File content is not available for this record.', 'error');
        return;
      }
      setPreviewFile({ name, type, dataUrl });
    },
    [addToast]
  );

  return (
    <div className="app-container">
      {/* Universal Sidebar (Dept Head menu comes from ROLE_NAV_ITEMS) */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <AppHeader />

        <main className="content-area">
          <Outlet context={{ addToast, openProcurementFile }} />
        </main>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <AdminToast toasts={toasts} />
    </div>
  );
}
