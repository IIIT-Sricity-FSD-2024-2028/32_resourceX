import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { useAuth } from '../../../context/AuthContext';

export default function StaffDashboard({ onLogout }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const customNav = [
    { id: 'overview', label: 'Warehouse Overview', icon: 'dashboard' },
    { id: 'dispatches', label: 'Allocation Dispatch', icon: 'local_shipping' },
    { id: 'stock', label: 'Stock Monitoring', icon: 'inventory' },
    { id: 'repairs', label: 'Maintenance Bench', icon: 'build' }
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customNavItems={customNav}
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
                  Warehouse & Inventory Staff
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
                  Physical asset allocations, return inspections, and stock replenishment queue.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/profile')}
                style={{ fontSize: '0.85rem' }}
              >
                Profile Settings
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Ready for Handout</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>8</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>outbox</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Returns Under Inspection</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>3</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>assignment_return</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Items Under Repair</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ef4444' }}>2</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fca5a5' }}>build</span>
                </div>
              </div>
            </div>

            {/* Warehouse Dispatch Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Pending Asset Dispatch Orders
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Target User</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Asset Type</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>DISP-901</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Alice Worker</td>
                      <td style={{ padding: '0.85rem 1rem' }}>HR Dept</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Dell Latitude 5420</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Issue Serial & Confirm</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
