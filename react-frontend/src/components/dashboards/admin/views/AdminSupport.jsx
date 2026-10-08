import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import NewTicketModal from '../components/NewTicketModal';
import {
  fetchAdminSupportTickets,
  createAdminSupportTicket
} from '../../../../services/admin';
import { getCurrentUser } from '../../../../services/auth';

/**
 * Exact replica of support-query-view from admin.html and admin.js
 */
export default function AdminSupport() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const currentUser = getCurrentUser();

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminSupportTickets();
      const myOrgId = currentUser?.organizationId;
      const mine = myOrgId ? (data || []).filter((t) => t.organizationId === myOrgId) : data || [];
      setTickets(mine);
    } catch (err) {
      addToast(err.message || 'Failed to load support tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async ({ title, description }) => {
    try {
      await createAdminSupportTicket({
        title,
        description,
        organizationId: currentUser?.organizationId
      });
      addToast('Support query raised! Your assigned employee will respond shortly.', 'success');
      loadData();
    } catch (err) {
      addToast(`Failed to raise query: ${err.message}`, 'error');
      throw err;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Open') {
      return <span className="badge pending">Open</span>;
    }
    if (status === 'Resolved') {
      return <span className="badge allocated">Resolved</span>;
    }
    return <span className="badge pending">{status || 'Open'}</span>;
  };

  return (
    <div id="support-query-view" className="view-section active">
      <h1 className="page-title">Support Queries</h1>
      <p className="page-subtitle">
        Raise a support ticket to your assigned Platform Employee. Track status and replies.
      </p>

      <div className="data-section-header" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
            add
          </span>
          Raise New Query
        </button>
      </div>

      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date Raised</th>
              <th>Reply</th>
            </tr>
          </thead>
          <tbody id="supportTicketsBody">
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No queries raised yet. Click "Raise New Query" to get help.
                </td>
              </tr>
            ) : (
              [...tickets].reverse().map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <strong>{t.title}</strong>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td>{t.date || '—'}</td>
                  <td>
                    {t.reply ? (
                      <span style={{ fontSize: '0.8rem', color: '#166534' }}>{t.reply}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Awaiting reply…</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
