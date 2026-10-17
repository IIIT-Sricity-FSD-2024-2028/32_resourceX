import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EmployeeStatsCards from '../components/EmployeeStatsCards';
import ResolveTicketModal from '../components/ResolveTicketModal';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';
import { fetchEmployeeDashboardOverview, resolveEmployeeTicket } from '../../../../services/employee';
import { useAuth } from '../../../../context/AuthContext';

export function renderStatusBadge(status) {
  if (status === 'Active' || status === 'Resolved') {
    return <span className="badge allocated">{status}</span>;
  }
  if (status === 'Suspended') {
    return <span className="badge rejected">{status}</span>;
  }
  if (status === 'Pending' || status === 'Open') {
    return <span className="badge pending">{status}</span>;
  }
  return <span className="badge">{status || '—'}</span>;
}

/**
 * Exact replica of dashboard-view from employee.html
 */
export default function EmployeeOverview() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [orgSearch, setOrgSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');

  // Resolve Ticket Modal state
  const [resolveTarget, setResolveTarget] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEmployeeDashboardOverview(currentUser?.id);
      setInstitutions(data.institutions);
      setTickets(data.tickets);
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

  const visibleInstitutions = institutions.filter((org) =>
    matchesSearch(orgSearch, org.id, org.name, org.adminEmail, org.status, org.subscriptionPlanId)
  );
  const openTickets = tickets
    .filter((t) => t.status === 'Open' && matchesSearch(ticketSearch, t.id, t.organizationId, t.title, t.date))
    .slice(0, 5);

  const handleResolve = async (id, reply) => {
    try {
      await resolveEmployeeTicket(id, reply);
      addToast('Ticket resolved and reply sent.', 'success');
      setResolveTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed to resolve ticket: ' + err.message, 'error');
      throw err;
    }
  };

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Employee Dashboard</h1>
      <p className="page-subtitle" id="empWelcome">
        {currentUser?.name
          ? `Welcome, ${currentUser.name} — manage your assigned institutions and support tickets.`
          : 'Manage your assigned institutions and support tickets.'}
      </p>

      <EmployeeStatsCards
        assignedInstitutions={stats.assignedInstitutions}
        openTickets={stats.openTickets}
        resolvedTickets={stats.resolvedTickets}
        announcementsSent={stats.announcementsSent}
      />

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">My Assigned Institutions</div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => navigate('/dashboard/employee/institutions')}
          >
            View All
          </button>
        </div>
        <TableToolbar
          search={orgSearch}
          onSearchChange={setOrgSearch}
          placeholder="Search by ID, name, admin email, status or plan..."
        />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Institution Name</th>
              <th>Admin Email</th>
              <th>Status</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody id="dashOrgsBody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : visibleInstitutions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {institutions.length === 0 ? 'No institutions assigned to you yet.' : 'No institutions match your search.'}
                </td>
              </tr>
            ) : (
              visibleInstitutions.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.adminEmail}</td>
                  <td>{renderStatusBadge(org.status)}</td>
                  <td>{org.subscriptionPlanId || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Recent Open Tickets</div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => navigate('/dashboard/employee/support')}
          >
            View All
          </button>
        </div>
        <TableToolbar
          search={ticketSearch}
          onSearchChange={setTicketSearch}
          placeholder="Search open tickets by ID, institution or title..."
        />
        <table className="table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Institution</th>
              <th>Title</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="dashTicketsBody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : openTickets.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {ticketSearch.trim() ? 'No open tickets match your search.' : 'No open tickets. All clear! ✅'}
                </td>
              </tr>
            ) : (
              openTickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.organizationId}</td>
                  <td><strong>{t.title}</strong></td>
                  <td>{t.date}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => setResolveTarget(t)}
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Ticket Modal */}
      <ResolveTicketModal
        isOpen={Boolean(resolveTarget)}
        onClose={() => setResolveTarget(null)}
        onSubmit={handleResolve}
        ticket={resolveTarget}
      />
    </div>
  );
}
