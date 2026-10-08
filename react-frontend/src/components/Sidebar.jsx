import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAdminSupportTickets, fetchAdminAnnouncements } from '../services/admin';

/**
 * Exact replica of the original AppSidebar component from admin.html
 * Fully dynamic for System Admin and other system roles.
 */
export default function Sidebar({ userRole, openTicketsCount: propOpenTickets, annCount: propAnnCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [openTickets, setOpenTickets] = useState(propOpenTickets || 0);
  const [announcements, setAnnouncements] = useState(propAnnCount || 0);

  const name = user?.name || 'yashwath';
  const role = userRole || user?.role || 'Administrator';
  const initial = name ? name.charAt(0).toUpperCase() : 'A';
  const isAdmin = role === 'System Admin' || role === 'Administrator';

  useEffect(() => {
    if (propOpenTickets !== undefined) setOpenTickets(propOpenTickets);
    if (propAnnCount !== undefined) setAnnouncements(propAnnCount);
  }, [propOpenTickets, propAnnCount]);

  useEffect(() => {
    if (isAdmin && propOpenTickets === undefined) {
      const loadCounts = async () => {
        try {
          const myOrgId = user?.organizationId;
          const [tData, aData] = await Promise.all([
            fetchAdminSupportTickets().catch(() => []),
            fetchAdminAnnouncements().catch(() => [])
          ]);
          const myTickets = myOrgId ? (tData || []).filter((t) => t.organizationId === myOrgId) : tData || [];
          const open = myTickets.filter((t) => t.status === 'Open').length;
          setOpenTickets(open);

          const myAnn = (aData || []).filter(
            (a) => a.targetOrgId === myOrgId || a.targetOrgId === 'ALL' || !a.targetOrgId
          );
          setAnnouncements(myAnn.length);
        } catch {
          // silently handle
        }
      };
      loadCounts();
    }
  }, [isAdmin, user?.organizationId, propOpenTickets]);

  const path = location.pathname;

  // Exact nav items from admin.html
  const adminNavItems = [
    { target: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/dashboard/admin/users', label: 'User Management', icon: 'group' },
    { target: '/dashboard/admin/departments', label: 'Department Configuration', icon: 'domain' },
    { target: '/dashboard/admin/subscription', label: 'Subscription Management', icon: 'subscriptions' },
    {
      target: '/dashboard/admin/support',
      label: 'Support Queries',
      icon: 'support_agent',
      badgeId: 'adminOpenTicketsBadge',
      badgeCount: openTickets,
      badgeClass: 'badge bg-warning text-dark'
    },
    {
      target: '/dashboard/admin/announcements',
      label: 'Announcements',
      icon: 'campaign',
      badgeId: 'adminAnnBadge',
      badgeCount: announcements,
      badgeClass: 'badge bg-primary'
    }
  ];

  // Generic nav items for other roles
  const otherNavItems = [
    { target: `/dashboard/${role.toLowerCase().replace(/\s+/g, '-')}`, label: 'Dashboard', icon: 'dashboard', isDefault: true },
    { target: '/profile', label: 'My Profile', icon: 'manage_accounts' }
  ];

  const items = isAdmin ? adminNavItems : otherNavItems;

  const isActive = (item) => {
    if (item.isDefault && (path === '/dashboard/admin' || path === '/dashboard/admin/' || path === '/dashboard/admin/dashboard')) {
      return true;
    }
    return path === item.target;
  };

  return (
    <aside className="sidebar">
      {/* Brand logo container identical to original layout */}
      <div
        className="logo-container"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
        title="Return to Home / Landing"
      >
        <div className="logo-icon">R</div>
        <div className="logo-text">ResourceX</div>
      </div>

      {/* Nav Menu identical to original HTML */}
      <ul className="nav-menu">
        {items.map((item) => (
          <li
            key={item.target}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            onClick={() => navigate(item.target)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
            {item.badgeCount > 0 && (
              <span
                id={item.badgeId}
                className={item.badgeClass}
                style={{ marginLeft: 'auto', display: 'inline-block' }}
              >
                {item.badgeCount}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* User profile widget identical to original HTML */}
      <div
        className="user-profile-widget"
        onClick={() => navigate('/profile')}
        title="View Profile"
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
          <span className="user-role">{role === 'System Admin' ? 'Administrator' : role}</span>
        </div>
      </div>
    </aside>
  );
}
