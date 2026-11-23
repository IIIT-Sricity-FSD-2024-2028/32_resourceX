import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import NewTicketModal from '../components/NewTicketModal';
import { matchesSearch } from '../../../common/TableToolbar';
import { useAuth } from '../../../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchSupportTickets,
  createSupportTicket,
  selectAdminTickets,
  selectAdminTicketsLoading,
} from '../../../../store/slices/admin/adminSlice';

/**
 * AdminSupport View
 * Institutional support desk allowing System Admin to log, track, and monitor
 * technical tickets addressed to assigned Platform Employees.
 * Fully integrated with Redux Toolkit (adminSlice).
 */
export default function AdminSupport() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  // Redux state
  const tickets = useAppSelector(selectAdminTickets);
  const isLoading = useAppSelector(selectAdminTicketsLoading);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [replyFilter, setReplyFilter] = useState('All');

  // Load support tickets
  useEffect(() => {
    dispatch(fetchSupportTickets());
  }, [dispatch]);

  const handleCreateTicket = async ({ title, description }) => {
    try {
      await dispatch(
        createSupportTicket({
          title,
          description,
          organizationId: currentUser?.organizationId,
        })
      ).unwrap();
      addToast('Support query raised! Your assigned employee will respond shortly.', 'success');
      setIsModalOpen(false);
      dispatch(fetchSupportTickets());
    } catch (err) {
      addToast(`Failed to raise query: ${err || 'Error'}`, 'error');
      throw err;
    }
  };

  const myOrgId = currentUser?.organizationId;
  const orgTickets = myOrgId ? tickets.filter((t) => t.organizationId === myOrgId) : tickets;

  const visibleTickets = [...orgTickets].reverse().filter((t) =>
    (statusFilter === 'All' || (t.status || 'Open') === statusFilter) &&
    (replyFilter === 'All' || (replyFilter === 'Replied') === Boolean(t.reply)) &&
    matchesSearch(search, t.id, t.title, t.description, t.date, t.reply)
  );

  const getStatusBadge = (status) => {
    if (status === 'Open') {
      return (
        <span className="badge pending" style={{ background: '#fef3c7', color: '#b45309' }}>
          Open
        </span>
      );
    }
    if (status === 'Resolved') {
      return (
        <span className="badge allocated" style={{ background: '#dcfce7', color: '#15803d' }}>
          Resolved
        </span>
      );
    }
    return (
      <span className="badge pending" style={{ background: '#e0f2fe', color: '#0369a1' }}>
        {status || 'Open'}
      </span>
    );
  };

  return (
    <div id="support-query-view" className="view-section active">
      <h1 className="page-title">Support Queries</h1>
      <p className="page-subtitle">
        Raise a support ticket to your assigned Platform Employee. Track status and replies.
      </p>

      {/* Action and Filter Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          className="btn-primary"
          id="raise-query-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Raise Support Query
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value)}
          >
            <option value="All">All Replies</option>
            <option value="Replied">With Reply</option>
            <option value="Pending">Awaiting Reply</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Search queries..."
            style={{ width: '220px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="data-section">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Loading support tickets...
          </div>
        ) : visibleTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No support tickets logged. Use <strong>+ Raise Support Query</strong> above if you require
            assistance from platform support.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visibleTickets.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {t.id}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        {t.title}
                      </h3>
                    </div>
                    {t.date && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                        Submitted on: {t.date}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                <p style={{ margin: '0 0 1rem', color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {t.description}
                </p>

                {t.reply ? (
                  <div
                    style={{
                      background: '#f0fdf4',
                      borderLeft: '4px solid #22c55e',
                      borderRadius: '0 6px 6px 0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8125rem',
                      color: '#15803d',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      Platform Employee Response:
                    </div>
                    <div style={{ color: '#166534' }}>{t.reply}</div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontStyle: 'italic',
                    }}
                  >
                    Awaiting response from platform staff.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
