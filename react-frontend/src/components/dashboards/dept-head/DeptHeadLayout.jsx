import React, { useState, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import AdminToast from '../admin/components/AdminToast';
import { useAuth } from '../../../context/AuthContext';
import '../../../pages/dept_head/deptHead.css';

/**
 * Layout shell from department_head.html
 * Hosts Sidebar, Top Header, and sub-routes rendered in content-area.
 * Views receive { addToast, department } through the outlet context.
 */
export default function DeptHeadLayout() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Only Department Heads may use this portal; everyone else goes to their own dashboard
  if (user && user.role !== 'Dept Head') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-wrapper">
        <AppHeader />

        <main className="content-area">
          <Outlet context={{ addToast, department: user?.department }} />
        </main>
      </div>

      <AdminToast toasts={toasts} />
    </div>
  );
}
