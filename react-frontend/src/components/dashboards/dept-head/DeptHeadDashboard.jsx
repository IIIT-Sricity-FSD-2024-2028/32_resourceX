import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar';
import AppHeader from '../../AppHeader';
import { getCurrentUser } from '../../../services/auth';

export default function DeptHeadDashboard({ onLogout }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');

  const customNav = [
    { id: 'overview', label: 'Department Overview', icon: 'dashboard' },
    { id: 'approvals', label: 'Pending Approvals', icon: 'fact_check' },
    { id: 'budget', label: 'Budget & Allocation', icon: 'account_balance' },
    { id: 'team', label: 'Department Roster', icon: 'groups' }
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customNavItems={customNav}
        userRole="Dept Head"
      />

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader
          userName={currentUser?.name || 'Department Head'}
          userRole="Dept Head"
          onLogout={onLogout}
        />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-color, #f8fafc)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
                  Department Head Portal
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
                  Department: <strong>{currentUser?.department || 'IT Services'}</strong> • Fiscal Requisition Approvals
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/profile')}
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>manage_accounts</span>
                Edit Profile
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Awaiting Approvals</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>4</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>pending_actions</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Approved This Month</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981' }}>18</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a7f3d0' }}>check_circle</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Remaining Budget</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>$24,500</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#bfdbfe' }}>account_balance_wallet</span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Department Members</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#6366f1' }}>15</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#c7d2fe' }}>groups</span>
                </div>
              </div>
            </div>

            {/* Skeleton Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Pending Employee Hardware Requisitions
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Request ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Requestor</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Item Requested</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Est. Cost</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>REQ-204</td>
                      <td style={{ padding: '0.85rem 1rem' }}>RAVI CHANDRA</td>
                      <td style={{ padding: '0.85rem 1rem' }}>MacBook Pro 16" (M3 Max)</td>
                      <td style={{ padding: '0.85rem 1rem' }}>$3,499</td>
                      <td style={{ padding: '0.85rem 1rem' }}><span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Pending Review</span></td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>Approve</button>
                        <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Reject</button>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>REQ-205</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Bob Builder</td>
                      <td style={{ padding: '0.85rem 1rem' }}>Dell Ultrasharp 4K Monitor</td>
                      <td style={{ padding: '0.85rem 1rem' }}>$650</td>
                      <td style={{ padding: '0.85rem 1rem' }}><span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Pending Review</span></td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button type="button" className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>Approve</button>
                        <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Reject</button>
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
