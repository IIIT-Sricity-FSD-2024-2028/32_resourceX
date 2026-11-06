import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Universal Navigation Map
 * Every role gets its dedicated first-class menu structure equally.
 */
const ROLE_NAV_ITEMS = {
  'System Admin': [
    { target: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/dashboard/admin/users', label: 'User Management', icon: 'group' },
    { target: '/dashboard/admin/departments', label: 'Department Configuration', icon: 'domain' },
    { target: '/dashboard/admin/subscription', label: 'Subscription Management', icon: 'subscriptions' },
    { target: '/dashboard/admin/support', label: 'Support Queries', icon: 'support_agent' },
    { target: '/dashboard/admin/announcements', label: 'Announcements', icon: 'campaign' },
   


    
  ],
  'Dept Head': [
    { target: '/dashboard/dept-head', label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/dashboard/dept-head/requests', label: 'Incoming Requests', icon: 'move_to_inbox' },
    { target: '/dashboard/dept-head/resources', label: 'Dept Resources', icon: 'corporate_fare' },
    { target: '/dashboard/dept-head/procurement', label: 'Procurement', icon: 'shopping_cart' },
    { target: '/dashboard/dept-head/stock', label: 'Stock Monitoring', icon: 'bar_chart' },
    { target: '/dashboard/dept-head/analytics', label: 'Analytics', icon: 'analytics' }
  ],
  'Requestor': [
    { id: 'overview', label: 'My Workspace', icon: 'dashboard' },
    { id: 'requests', label: 'My Requisitions', icon: 'shopping_cart' },
    { id: 'assets', label: 'Allocated Equipment', icon: 'devices' },
    { id: 'repairs', label: 'Maintenance Tickets', icon: 'build' }
  ],
  'Registrar': [
    { id: 'overview', label: 'Registrar Overview', icon: 'dashboard' },
    { id: 'procurements', label: 'Procurements & Invoices', icon: 'receipt_long' },
    { id: 'tagging', label: 'RFID Asset Tagging', icon: 'qr_code_scanner' },
    { id: 'catalog', label: 'Master Catalog', icon: 'menu_book' }
  ],
  'Owner': [
    { target: '/dashboard/owner', label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/dashboard/owner/revenue', label: 'Revenue Analysis', icon: 'bar_chart' },
    { target: '/dashboard/owner/organizations', label: 'Organization Management', icon: 'corporate_fare' },
    { target: '/dashboard/owner/employees', label: 'Employee Management', icon: 'badge' },
    { target: '/dashboard/owner/create-employee', label: 'Create Employee', icon: 'person_add' },
    { target: '/dashboard/owner/registrations', label: 'Org Registrations', icon: 'pending_actions' }
  ],
  'Employee': [
    { target: '/dashboard/employee', label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/dashboard/employee/support', label: 'Support Management', icon: 'support_agent' },
    { target: '/dashboard/employee/institutions', label: 'Institution Management', icon: 'corporate_fare' },
    { target: '/dashboard/employee/communication', label: 'Communication', icon: 'campaign' }
  ]
};

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 76;
const STORAGE_KEY = 'rx_sidebar';

const clampWidth = (w) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(w)));

// Width and collapsed state are a per-browser convenience; fall back to defaults if storage is unavailable
function loadSidebarPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      width: Number.isFinite(saved.width) ? clampWidth(saved.width) : DEFAULT_WIDTH,
      collapsed: Boolean(saved.collapsed),
    };
  } catch {
    return { width: DEFAULT_WIDTH, collapsed: false };
  }
}

/**
 * Universal, Reusable Sidebar Navigation Component
 * Treats all 7 roles equally, dynamically loading their menu from AuthContext.
 */
export default function Sidebar({ customNavItems, activeTab, onTabChange } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const name = user?.name || 'User';
  const role = user?.role || 'Member';
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  const [width, setWidth] = useState(() => loadSidebarPrefs().width);
  const [collapsed, setCollapsed] = useState(() => loadSidebarPrefs().collapsed);
  const [isResizing, setIsResizing] = useState(false);
  const asideRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ width, collapsed }));
    } catch {
      // storage unavailable: preferences just won't persist
    }
  }, [width, collapsed]);

  // Drag the right edge to resize (mouse, touch or pen)
  const startResize = (e) => {
    e.preventDefault();
    const left = asideRef.current?.getBoundingClientRect().left || 0;
    setIsResizing(true);
    const onMove = (ev) => setWidth(clampWidth(ev.clientX - left));
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizeKey = (e) => {
    if (e.key === 'ArrowLeft') setWidth((w) => clampWidth(w - 20));
    if (e.key === 'ArrowRight') setWidth((w) => clampWidth(w + 20));
  };

  // All roles treated equally from the map
  const items = customNavItems || ROLE_NAV_ITEMS[role] || [
    { target: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { target: '/profile', label: 'My Profile', icon: 'manage_accounts' }
  ];

  const path = location.pathname;

  const isActive = (item) => {
    if (activeTab && item.id) {
      return activeTab === item.id;
    }
    // Default (index) item stays active on the role's base path, e.g. /dashboard/admin or /dashboard/dept-head
    if (item.isDefault && item.target) {
      const base = item.target.replace(/\/$/, '');
      if (path === base || path === `${base}/` || path === `${base}/dashboard` || path === `${base}/overview`) {
        return true;
      }
    }
    return path === item.target;
  };

  const handleItemClick = (item) => {
    if (item.id && onTabChange) {
      onTabChange(item.id);
    } else if (item.target) {
      navigate(item.target);
    }
  };

  return (
    <aside
      ref={asideRef}
      className={`sidebar${collapsed ? ' collapsed' : ''}${isResizing ? ' resizing' : ''}`}
      style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
    >
      {/* Brand logo (not a link: dashboards stay in the app) */}
      <div className="sidebar-logo-container logo-container">
        <div className="logo-icon">R</div>
        <div className="logo-text">ResourceX</div>
      </div>

      {/* Open / close toggle */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        <span className="material-symbols-outlined">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
      </button>

      {/* Drag handle to resize; double-click resets the width */}
      {!collapsed && (
        <div
          className="sidebar-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          title="Drag to resize, double-click to reset"
          onPointerDown={startResize}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
          onKeyDown={handleResizeKey}
        />
      )}

      {/* Nav Menu */}
      <ul className="nav-menu">
        {items.map((item) => (
          <li
            key={item.target || item.id}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            onClick={() => handleItemClick(item)}
            title={collapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </li>
        ))}
      </ul>

      {/* User profile widget */}
      <div
        className="user-profile-widget"
        onClick={() => navigate('/profile')}
        title={collapsed ? `${name} — View Profile` : 'View Profile'}
      >
        <div className="user-avatar" style={{ overflow: 'hidden' }}>
          <div
            style={{
              background: '#1e293b',
              color: 'white',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {initial}
          </div>
        </div>
        <div className="user-info">
          <span className="user-name">{name}</span>
          {/* Real role for every user */}
          <span className="user-role">{role === 'Dept Head' && user?.department ? `${user.department} Head` : role}</span>
        </div>
      </div>
    </aside>
  );
}
