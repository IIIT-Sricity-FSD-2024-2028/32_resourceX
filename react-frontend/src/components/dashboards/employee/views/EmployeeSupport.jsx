import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ResolveTicketModal from '../components/ResolveTicketModal';
import { renderStatusBadge } from './EmployeeOverview';
import { fetchEmployeeTickets, resolveEmployeeTicket } from '../../../../services/employee';

const FILTERS = ['Open', 'Resolved', 'All'];

/**
 * Exact replica of support-view from employee.html
 */
export default function EmployeeSupport() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Open');

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

  const list = filter === 'All' ? tickets : tickets.filter((t) => t.status === filter);

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

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="data-section">
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
                  No {filter === 'All' ? '' : `${filter.toLowerCase()} `}tickets found.
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
