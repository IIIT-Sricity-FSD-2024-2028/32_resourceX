import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { getCurrentUser } from '../../../services/auth';

export default function OwnerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');

  const customNav = [
    { id: 'overview', label: 'Platform Metrics', icon: 'monitoring' },
    { id: 'organizations', label: 'Tenants & Orgs', icon: 'corporate_fare' },
    { id: 'revenue', label: 'Billing & Plans', icon: 'payments' },
    { id: 'employees', label: 'Platform Staff', icon: 'badge' }
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customNavItems={customNav}
        userRole="Owner"
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader
          userName={currentUser?.name || 'Platform Owner'}
          userRole="Owner"
          onLogout={onLogout}
        />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
                  Platform Owner Control Plane
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
                  Multi-tenant SaaS administrative overview, tenant onboarding, and ecosystem telemetry.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/profile')}
                style={{ fontSize: '0.85rem' }}
              >
                Owner Settings
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Tenant Organizations</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>14</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>corporate_fare</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Subscriptions</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981' }}>12</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a7f3d0' }}>loyalty</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Support Employees</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#6366f1' }}>5</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#c7d2fe' }}>support_agent</span>
                </div>
              </div>
            </div>

            {/* Organizations Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Onboarded Tenant Organizations
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Org ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Organization Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Admin Contact</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tier</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>ORG-001</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>ResourceX Tech HQ</td>
                      <td style={{ padding: '0.85rem 1rem' }}>yashwath@resourcex.com</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Enterprise Pro</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>ORG-002</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>Apex Industries</td>
                      <td style={{ padding: '0.85rem 1rem' }}>admin@org2.com</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Professional Tier</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span></td>
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
