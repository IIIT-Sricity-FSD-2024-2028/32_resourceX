import React, { useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import OwnerStatsCards from '../components/OwnerStatsCards';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import {
  fetchOwnerDashboardOverview,
  selectOwnerOrganizations,
  selectOwnerEmployees,
  selectOwnerInvoices,
  selectOwnerStats,
  selectOwnerOverviewLoading,
} from '../../../../store/slices/owner/ownerSlice';
import { selectCurrentUser } from '../../../../store/slices/auth/authSlice';
import {
  fetchNotifications,
  markNotificationRead,
  selectNotifications,
  selectUnreadCount,
} from '../../../../store/slices/notifications/notificationsSlice';

export function renderStatusBadge(status) {
  if (status === 'Active' || status === 'Resolved' || status === 'Paid') {
    return <span className="badge allocated">{status}</span>;
  }
  if (status === 'Suspended' || status === 'Overdue') {
    return <span className="badge rejected">{status}</span>;
  }
  if (status === 'Pending' || status === 'Unpaid' || status === 'Open') {
    return <span className="badge pending">{status}</span>;
  }
  return <span className="badge">{status || '—'}</span>;
}

/**
 * Exact replica of dashboard-view from owner.html connected to Redux
 */
export default function OwnerOverview() {
  const dispatch = useDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const currentUser = useSelector(selectCurrentUser);

  const organizations = useSelector(selectOwnerOrganizations);
  const employees = useSelector(selectOwnerEmployees);
  const invoices = useSelector(selectOwnerInvoices);
  const stats = useSelector(selectOwnerStats);
  const isLoading = useSelector(selectOwnerOverviewLoading);
  const notifications = useSelector(selectNotifications) || [];
  const unreadCount = useSelector(selectUnreadCount);

  const [orgSearch, setOrgSearch] = React.useState('');
  const [orgStatusFilter, setOrgStatusFilter] = React.useState('All');
  const [orgPlanFilter, setOrgPlanFilter] = React.useState('All');
  const [invoiceSearch, setInvoiceSearch] = React.useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = React.useState('All');

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchOwnerDashboardOverview()).unwrap(),
        dispatch(fetchNotifications()).unwrap().catch(() => []),
      ]);
    } catch (err) {
      addToast(err?.message || err || 'Failed to load dashboard data', 'error');
    }
  }, [dispatch, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || '—';
  const orgName = (id) => organizations.find((o) => o.id === id)?.name || '';

  const visibleOrgs = organizations.filter((org) =>
    (orgStatusFilter === 'All' || org.status === orgStatusFilter) &&
    (orgPlanFilter === 'All' || org.subscriptionPlanId === orgPlanFilter) &&
    matchesSearch(orgSearch, org.id, org.name, org.adminEmail, employeeName(org.assignedEmployeeId), org.subscriptionPlanId)
  );
  const visibleInvoices = invoices.filter((inv) =>
    (invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter) &&
    matchesSearch(invoiceSearch, inv.id, inv.organizationId, orgName(inv.organizationId), inv.planName, inv.dueDate)
  );

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Owner Dashboard</h1>
      <p className="page-subtitle">
        {currentUser?.name
          ? `Welcome, ${currentUser.name} — platform overview, organizations, employees and billing.`
          : 'Platform overview — organizations, employees and billing.'}
      </p>

      <OwnerStatsCards
        activeOrgs={stats.activeOrgs}
        pendingOrgs={stats.pendingOrgs}
        totalRevenue={stats.totalRevenue}
        totalEmployees={stats.totalEmployees}
      />

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">All Organizations</div>
        </div>
        <TableToolbar
          search={orgSearch}
          onSearchChange={setOrgSearch}
          placeholder="Search by ID, name, admin email or employee..."
          filters={[
            { label: 'All Statuses', value: orgStatusFilter, onChange: setOrgStatusFilter, options: uniqueOptions(organizations, 'status') },
            { label: 'All Plans', value: orgPlanFilter, onChange: setOrgPlanFilter, options: uniqueOptions(organizations, 'subscriptionPlanId') },
          ]}
          resultCount={visibleOrgs.length}
          totalCount={organizations.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Organization Name</th>
              <th>Admin Email</th>
              <th>Status</th>
              <th>Assigned Employee</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody id="dashOrgsTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading organizations...
                </td>
              </tr>
            ) : visibleOrgs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No organizations found.
                </td>
              </tr>
            ) : (
              visibleOrgs.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.adminEmail}</td>
                  <td>{renderStatusBadge(org.status)}</td>
                  <td>{employeeName(org.assignedEmployeeId)}</td>
                  <td>{org.subscriptionPlanId || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Invoices</div>
        </div>
        <TableToolbar
          search={invoiceSearch}
          onSearchChange={setInvoiceSearch}
          placeholder="Search by invoice ID or organization..."
          filters={[
            { label: 'All Statuses', value: invoiceStatusFilter, onChange: setInvoiceStatusFilter, options: uniqueOptions(invoices, 'status') },
          ]}
          resultCount={visibleInvoices.length}
          totalCount={invoices.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Organization</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody id="invoicesTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : visibleInvoices.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              visibleInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.organizationId}</td>
                  <td>${inv.amount?.toLocaleString?.() ?? inv.amount}</td>
                  <td>{renderStatusBadge(inv.status)}</td>
                  <td>{inv.dueDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">
            Platform Notifications
            {unreadCount > 0 && (
              <span className="badge pending" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No platform notifications.
                </td>
              </tr>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>
                    <strong>{n.title || n.message || 'Notification'}</strong>
                    {n.title && n.message && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    )}
                  </td>
                  <td><span className="badge">{n.type || 'System'}</span></td>
                  <td>{n.read ? <span className="badge allocated">Read</span> : <span className="badge pending">Unread</span>}</td>
                  <td>
                    {!n.read && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => dispatch(markNotificationRead(n.id))}
                      >
                        Mark Read
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
