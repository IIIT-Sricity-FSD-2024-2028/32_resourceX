import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ResolveTicketModal from '../components/ResolveTicketModal';
import { renderStatusBadge } from './EmployeeOverview';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import { fetchEmployeeTickets, resolveEmployeeTicket } from '../../../../services/employee';

const STATUSES = ['Open', 'In Progress', 'Resolved'];

/**
 * Exact replica of support-view from employee.html
 */
export default function EmployeeSupport() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Open');
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');

  // Resolve Ticket Modal state
  const [resolveTarget, setResolveTarget] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      setTickets(await fetchEmployeeTickets());
    } catch (err) {
      addToast(err.message || 'Failed to load support tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = tickets.filter((t) =>
    (filter === 'All' || t.status === filter) &&
    (orgFilter === 'All' || t.organizationId === orgFilter) &&
    matchesSearch(search, t.id, t.organizationId, t.title, t.description, t.createdBy, t.date)
  );

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
    <div id="support-view" className="view-section active">
      <h1 className="page-title">Support Management</h1>
      <p className="page-subtitle">Review and resolve technical or operational issues reported by institutions.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by ticket ID, institution, title or description..."
          filters={[
            { label: 'All Statuses', value: filter, onChange: setFilter, options: STATUSES },
            { label: 'All Institutions', value: orgFilter, onChange: setOrgFilter, options: uniqueOptions(tickets, 'organizationId') },
          ]}
          resultCount={list.length}
          totalCount={tickets.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Institution</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="ticketsTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No tickets match your search or filters.
                </td>
              </tr>
            ) : (
              list.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.organizationId}</td>
                  <td><strong>{t.title}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description || '—'}</td>
                  <td>{renderStatusBadge(t.status)}</td>
                  <td>{t.date}</td>
                  <td>
                    {t.status === 'Open' ? (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => setResolveTarget(t)}
                      >
                        Resolve
                      </button>
                    ) : (
                      renderStatusBadge('Resolved')
                    )}
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
