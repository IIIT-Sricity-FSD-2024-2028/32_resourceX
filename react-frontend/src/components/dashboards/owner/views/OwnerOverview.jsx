import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import OwnerStatsCards from '../components/OwnerStatsCards';
import { fetchOwnerDashboardOverview } from '../../../../services/owner';

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
 * Exact replica of dashboard-view from owner.html
 */
export default function OwnerOverview() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [organizations, setOrganizations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOwnerDashboardOverview();
      setOrganizations(data.organizations);
      setEmployees(data.employees);
      setInvoices(data.invoices);
      setStats(data.stats);
    } catch (err) {
      addToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || '—';

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Owner Dashboard</h1>
      <p className="page-subtitle">Platform overview — organizations, employees and billing.</p>

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
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No organizations found.
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
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
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
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
    </div>
  );
}
