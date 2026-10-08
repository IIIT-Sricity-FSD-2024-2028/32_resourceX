import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import AdminToast from './components/AdminToast';
import { getCurrentUser } from '../../../services/auth';

/**
 * Exact layout shell from admin.html
 * Hosting Sidebar, Top Header, and sub-routes rendered in content-area
 */
export default function AdminLayout({ onLogout }) {
  const currentUser = getCurrentUser();
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <div className="app-container">
      {/* Universal Sidebar */}
      <Sidebar userRole="System Admin" />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <AppHeader
          userName={currentUser?.name || 'yashwath'}
          userRole="System Admin"
          onLogout={onLogout}
        />

        {/* Content Area */}
        <main className="content-area">
          <Outlet context={{ addToast }} />
        </main>
      </div>

      {/* Toast Notifications */}
      <AdminToast toasts={toasts} />
    </div>
  );
}
