import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReplyAnnModal from '../components/ReplyAnnModal';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';
import { useAuth } from '../../../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAnnouncements,
  replyAnnouncement,
  selectAdminAnnouncements,
  selectAdminAnnouncementsLoading,
  selectAnnouncementOperationLoading,
} from '../../../../store/slices/admin/adminSlice';

/**
 * AdminAnnouncements View
 * Broadcast center displaying platform notifications, system updates, policy bulletins,
 * and allowing System Admins to post replies back to platform employees.
 * Fully integrated with Redux Toolkit (adminSlice).
 */
export default function AdminAnnouncements() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  // Redux state
  const announcements = useAppSelector(selectAdminAnnouncements);
  const isLoading = useAppSelector(selectAdminAnnouncementsLoading);
  const isOperating = useAppSelector(selectAnnouncementOperationLoading);

  // Local state
  const [replyTarget, setReplyTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [replyFilter, setReplyFilter] = useState('All');

  // Load announcements
  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const handleReplyAnn = async (id, replyText) => {
    try {
      await dispatch(replyAnnouncement({ id, replyText })).unwrap();
      addToast('Reply sent successfully.', 'success');
      setReplyTarget(null);
      dispatch(fetchAnnouncements());
    } catch (err) {
      addToast(`Failed to send reply: ${err || 'Error'}`, 'error');
      throw err;
    }
  };

  const myOrgId = currentUser?.organizationId;
  const orgAnnouncements = (announcements || []).filter(
    (a) => a.targetOrgId === myOrgId || a.targetOrgId === 'ALL' || !a.targetOrgId
  );

  const visibleAnnouncements = [...orgAnnouncements].reverse().filter((a) =>
    (typeFilter === 'All' || (a.type || 'General') === typeFilter) &&
    (replyFilter === 'All' || (replyFilter === 'Replied') === Boolean(a.adminReply || a.reply)) &&
    matchesSearch(search, a.id, a.type, a.title, a.message, a.content, a.date)
  );

  const typeColors = {
    Maintenance: { bg: '#fef3c7', text: '#92400e' },
    'New Feature': { bg: '#dbeafe', text: '#1d4ed8' },
    Policy: { bg: '#ede9fe', text: '#7c3aed' },
    Subscription: { bg: '#dcfce7', text: '#166534' },
    General: { bg: '#f1f5f9', text: '#334155' },
  };

  return (
    <div id="announcements-view" className="view-section active">
      <h1 className="page-title">Announcements</h1>
      <p className="page-subtitle">Notifications and updates sent by your Platform Employee.</p>

      {/* Filter and Search Bar */}
      <div className="data-section" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="Search announcements..."
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Maintenance">Maintenance</option>
            <option value="New Feature">New Feature</option>
            <option value="Policy">Policy</option>
            <option value="Subscription">Subscription</option>
            <option value="General">General</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Replied">Replied</option>
            <option value="Pending">Unreplied</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="data-section">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Loading announcements...
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No platform announcements found matching your criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {visibleAnnouncements.map((a) => {
              const style = typeColors[a.type] || typeColors.General;
              const hasReplied = Boolean(a.adminReply || a.reply);

              return (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1.5rem',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          background: style.bg,
                          color: style.text,
                        }}
                      >
                        {a.type || 'General'}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                        {a.title}
                      </h3>
                    </div>
                    {a.date && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Published: {a.date}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      margin: '0 0 1.25rem',
                      color: '#334155',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {a.message || a.content || ''}
                  </p>

                  {/* Reply Section */}
                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      {hasReplied ? (
                        <div style={{ fontSize: '0.8125rem', color: '#15803d' }}>
                          <strong>Your Institutional Reply:</strong>{' '}
                          <span style={{ color: '#334155' }}>{a.adminReply || a.reply}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No acknowledgement sent yet.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                      onClick={() => setReplyTarget(a)}
                    >
                      {hasReplied ? 'Edit Reply' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <ReplyAnnModal
        isOpen={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        onSubmit={handleReplyAnn}
        announcement={replyTarget}
      />
    </div>
  );
}
