import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { useAuth } from '../../../context/AuthContext';

export default function EmployeeDashboard({ onLogout }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const customNav = [
    { id: 'overview', label: 'Support Queue', icon: 'support_agent' },
    { id: 'announcements', label: 'Tenant Broadcasts', icon: 'campaign' },
    { id: 'tickets', label: 'Assigned Tickets', icon: 'confirmation_number' },
    { id: 'tenants', label: 'Assigned Tenants', icon: 'apartment' }
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customNavItems={customNav}
        userRole="Employee"
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader
          userName={currentUser?.name || 'Platform Employee'}
          userRole="Employee"
          onLogout={onLogout || logout}
        />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
                  Platform Support Desk
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
                  Resolution desk for assigned tenant organizations and operational broadcasts.
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Open Tenant Tickets</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>3</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>pending_actions</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Organizations</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>4</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>apartment</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Resolved This Week</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981' }}>15</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a7f3d0' }}>task_alt</span>
                </div>
              </div>
            </div>

            {/* Support Queue Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Incoming Support Inquiries
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Ticket ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tenant Organization</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>TICK-501</td>
                      <td style={{ padding: '0.85rem 1rem' }}>ResourceX Tech HQ (ORG-001)</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Hardware allocation sync lag</td>
                      <td style={{ padding: '0.85rem 1rem' }}><span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Open</span></td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Resolve & Reply</button>
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
