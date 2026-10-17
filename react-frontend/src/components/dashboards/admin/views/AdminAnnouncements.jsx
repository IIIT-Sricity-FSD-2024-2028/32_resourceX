import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReplyAnnModal from '../components/ReplyAnnModal';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import {
  fetchAdminAnnouncements,
  replyToAnnouncement
} from '../../../../services/admin';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Exact replica of announcements-view from admin.html and admin.js
 */
export default function AdminAnnouncements() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [replyFilter, setReplyFilter] = useState('All');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const all = await fetchAdminAnnouncements();
      const myOrgId = currentUser?.organizationId;
      const mine = (all || []).filter(
        (a) => a.targetOrgId === myOrgId || a.targetOrgId === 'ALL' || !a.targetOrgId
      );
      setAnnouncements(mine);
    } catch (err) {
      addToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReplyAnn = async (id, replyText) => {
    try {
      await replyToAnnouncement(id, replyText);
      addToast('Reply sent successfully.', 'success');
      setReplyTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed to send reply: ' + err.message, 'error');
      throw err;
    }
  };

  const visibleAnnouncements = [...announcements].reverse().filter((a) =>
    (typeFilter === 'All' || (a.type || 'General') === typeFilter) &&
    (replyFilter === 'All' || (replyFilter === 'Replied') === Boolean(a.adminReply || a.reply)) &&
    matchesSearch(search, a.id, a.type, a.title, a.message, a.content, a.date)
  );

  const typeColors = {
    Maintenance: '#92400e',
    'New Feature': '#1d4ed8',
    Policy: '#7c3aed',
    Subscription: '#166534',
    General: '#334155'
  };

  return (
    <div id="announcements-view" className="view-section active">
      <h1 className="page-title">Announcements</h1>
      <p className="page-subtitle">Notifications and updates sent by your Platform Employee.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by ID, title, message or date..."
          filters={[
            { label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: uniqueOptions(announcements, (a) => a.type || 'General') },
            { label: 'All Replies', value: replyFilter, onChange: setReplyFilter, options: ['Replied', 'Not Replied'] },
          ]}
          resultCount={visibleAnnouncements.length}
          totalCount={announcements.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Title</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="adminAnnouncementsBody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading...
                </td>
              </tr>
            ) : visibleAnnouncements.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {announcements.length === 0
                    ? 'No announcements from your Platform Employee yet.'
                    : 'No announcements match your search or filters.'}
                </td>
              </tr>
            ) : (
              visibleAnnouncements.map((a) => {
                const color = typeColors[a.type] || '#334155';
                const hasReplied = Boolean(a.adminReply || a.reply);

                return (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: '#f1f5f9', color, fontWeight: 600 }}
                      >
                        {a.type || 'General'}
                      </span>
                    </td>
                    <td>
                      <strong>{a.title}</strong>
                      {hasReplied && (
                        <>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: '#166534' }}>✓ Replied</span>
                        </>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        maxWidth: '240px'
                      }}
                    >
                      {a.message || a.content || '—'}
                    </td>
                    <td>
                      {a.date || '—'}
                      <br />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          marginTop: '0.3rem'
                        }}
                        onClick={() => setReplyTarget(a)}
                      >
                        Reply
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reply Announcement Modal */}
      <ReplyAnnModal
        isOpen={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        onSubmit={handleReplyAnn}
        announcement={replyTarget}
      />
    </div>
  );
}
