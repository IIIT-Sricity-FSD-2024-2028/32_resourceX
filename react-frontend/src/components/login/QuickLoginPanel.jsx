import React from 'react';

/**
 * Demo accounts for every actor, matching backend/src/data/seed.ts.
 */
export const QUICK_LOGIN_ACCOUNTS = [
  { role: 'Owner', icon: 'workspace_premium', email: 'owner@resourcex.com', password: 'password' },
  { role: 'Employee', icon: 'support_agent', email: 'employee1@resourcex.com', password: 'password' },
  { role: 'System Admin', icon: 'admin_panel_settings', email: 'systemadmin@gmail.com', password: '12345678' },
  { role: 'Registrar', icon: 'how_to_reg', email: 'registrar@gmail.com', password: '12345678' },
  { role: 'Dept Head', icon: 'supervisor_account', email: 'depthead@gmail.com', password: '12345678' },
  { role: 'Requestor', icon: 'person', email: 'requestor@gmail.com', password: '12345678' },
  { role: 'Inventory Officer', icon: 'inventory_2', email: 'inventoryofficer@gmail.com', password: '12345678' },
  { role: 'Maintenance Officer', icon: 'build', email: 'maintenanceofficer@gmail.com', password: '12345678' },
  { role: 'Procurement Officer', icon: 'shopping_cart', email: 'procurementofficer@gmail.com', password: '12345678' }
];

/**
 * Side panel with one-click sign-in for each actor.
 *
 * Props:
 *   - onQuickLogin({ email, password }): signs in with the chosen account
 *   - isSubmitting: disables the buttons while a sign-in is in progress
 */
export default function QuickLoginPanel({ onQuickLogin, isSubmitting }) {
  return (
    <aside className="quick-login-panel">
      <h3 className="quick-login-title">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bolt</span>
        Quick Login
      </h3>
      <p className="quick-login-subtitle">Sign in instantly as any actor with a demo account.</p>

      <div className="quick-login-list">
        {QUICK_LOGIN_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            className="quick-login-item"
            onClick={() => onQuickLogin({ email: account.email, password: account.password })}
            disabled={isSubmitting}
            title={`Sign in as ${account.role}`}
          >
            <span className="material-symbols-outlined quick-login-icon">{account.icon}</span>
            <span className="quick-login-text">
              <span className="quick-login-role">{account.role}</span>
              <span className="quick-login-email">{account.email}</span>
            </span>
            <span className="material-symbols-outlined quick-login-arrow">chevron_right</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
