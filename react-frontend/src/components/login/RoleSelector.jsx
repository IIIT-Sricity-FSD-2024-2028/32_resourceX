import React from 'react';

const ROLES = [
  { id: 'Owner', label: 'Platform Owner', icon: 'shield_person', isPlatform: true, desc: 'SaaS Platform Admin' },
  { id: 'Employee', label: 'Platform Employee', icon: 'support_agent', isPlatform: true, desc: 'Support & Ops' },
  { id: 'System Admin', label: 'System Admin', icon: 'admin_panel_settings', isPlatform: false, desc: 'Tenant IT Administrator' },
  { id: 'Dept Head', label: 'Department Head', icon: 'supervisor_account', isPlatform: false, desc: 'Budget & Approvals' },
  { id: 'Requestor', label: 'Requestor', icon: 'person', isPlatform: false, desc: 'Employee / Faculty' },
  { id: 'Staff', label: 'Staff', icon: 'inventory', isPlatform: false, desc: 'Inventory & Allocations' },
  { id: 'Registrar', label: 'Registrar', icon: 'fact_check', isPlatform: false, desc: 'Asset Registration & Tagging', fullWidth: true }
];

export default function RoleSelector({ onSelectRole, onRegisterOrg }) {
  return (
    <div className="role-selector-step">
      <h2 className="login-title">Select Your Role</h2>
      <p className="login-subtitle">Choose how you want to sign in to ResourceX</p>

      <div className="role-grid">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`role-card-btn ${r.fullWidth ? 'full-width' : ''}`}
            onClick={() => onSelectRole(r.id, r.isPlatform)}
          >
            <span className="material-symbols-outlined role-icon">{r.icon}</span>
            <span>{r.label}</span>
            <span className="role-tag">{r.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
        <button
          type="button"
          onClick={onRegisterOrg}
          style={{ background: 'none', border: 'none', color: 'var(--primary-color, #0F386E)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
        >
          New here? Register your Organization &rarr;
        </button>
      </div>
    </div>
  );
}
