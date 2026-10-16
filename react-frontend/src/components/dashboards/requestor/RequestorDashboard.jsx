import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { useAuth } from '../../../context/AuthContext';

export default function RequestorDashboard({ onLogout }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const customNav = [
    { id: 'overview', label: 'My Workspace', icon: 'dashboard' },
    { id: 'requests', label: 'My Requisitions', icon: 'shopping_cart' },
    { id: 'assets', label: 'Allocated Equipment', icon: 'devices' },
    { id: 'repairs', label: 'Maintenance Tickets', icon: 'build' }
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
                  Requestor Self-Service Desk
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
                  Order hardware, inspect allocated equipment, or file damage replacement tickets.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => alert('New request flow skeleton')}
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                  New Requisition
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/profile')}
                  style={{ fontSize: '0.85rem' }}
                >
                  Profile
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Assets Assigned</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>3</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>devices</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Requests</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>1</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>schedule</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Return / Repairs</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981' }}>0</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a7f3d0' }}>published_with_changes</span>
                </div>
              </div>
            </div>

            {/* Allocated Equipment Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Your Assigned Hardware & Licenses
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Asset Tag</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Serial Number</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>RES-1049</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Lenovo ThinkPad X1 Carbon Gen 10</td>
                      <td style={{ padding: '0.85rem 1rem' }}>SN-8829-994</td>
                      <td style={{ padding: '0.85rem 1rem' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Allocated</span></td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Request Repair</button>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>RES-3301</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Logitech MX Master 3S Wireless Mouse</td>
                      <td style={{ padding: '0.85rem 1rem' }}>SN-1029-441</td>
                      <td style={{ padding: '0.85rem 1rem' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Allocated</span></td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Initiate Return</button>
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
