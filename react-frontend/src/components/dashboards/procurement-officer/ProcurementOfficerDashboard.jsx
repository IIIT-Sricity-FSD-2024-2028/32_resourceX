import React, { useState, useCallback } from 'react';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import ProcOfficerOverview from './views/ProcOfficerOverview';
import ProcurementOrdersView from './views/ProcurementOrdersView';
import PurchaseHistoryView from './views/PurchaseHistoryView';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
  { id: 'orders', label: 'Procurement Orders', icon: 'shopping_cart' },
  { id: 'purchase-history', label: 'Purchase History', icon: 'receipt_long' },
];

export default function ProcurementOfficerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const TOAST_COLORS = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} customNavItems={NAV_ITEMS} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
            {activeTab === 'overview' && <ProcOfficerOverview onNavigate={setActiveTab} addToast={addToast} />}
            {activeTab === 'orders' && <ProcurementOrdersView addToast={addToast} />}
            {activeTab === 'purchase-history' && <PurchaseHistoryView addToast={addToast} />}
          </div>
        </main>
      </div>

      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1e293b', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, minWidth: 280, maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', borderLeft: `4px solid ${TOAST_COLORS[t.type] || '#3b82f6'}` }}>
            <span className="material-icons" style={{ fontSize: 18, color: TOAST_COLORS[t.type] || '#3b82f6' }}>
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : 'info'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
