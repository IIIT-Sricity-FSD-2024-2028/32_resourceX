import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AnnouncementModal from '../components/AnnouncementModal';
import RepliesModal from '../components/RepliesModal';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import {
  fetchEmployeeInstitutions,
  fetchEmployeeAnnouncements,
  createEmployeeAnnouncement,
  selectEmployeeInstitutions,
  selectEmployeeAnnouncements,
  selectEmployeeLoading,
} from '../../../../store/slices/employee/employeeSlice';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Exact replica of communication-view from employee.html connected to Redux
 */
export default function EmployeeCommunication() {
  const dispatch = useDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  const institutions = useSelector(selectEmployeeInstitutions);
  const announcements = useSelector(selectEmployeeAnnouncements);
  const isLoading = useSelector(selectEmployeeLoading);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [targetFilter, setTargetFilter] = useState('All');
  const [replyFilter, setReplyFilter] = useState('All');

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  const employeeId = currentUser?.id;

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchEmployeeInstitutions(employeeId)).unwrap().catch(() => []),
        dispatch(fetchEmployeeAnnouncements()).unwrap()
      ]);
    } catch (err) {
      addToast(err?.message || err || 'Failed to load announcements', 'error');
    }
  }, [dispatch, employeeId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const targetLabel = (a) => (a.targetOrgId === 'ALL' ? 'All Institutions (Broadcast)' : a.targetOrgId);
  const visibleAnnouncements = [...announcements].reverse().filter((a) =>
    (typeFilter === 'All' || a.type === typeFilter) &&
    (targetFilter === 'All' || targetLabel(a) === targetFilter) &&
    (replyFilter === 'All' || (replyFilter === 'Replied') === Boolean(a.adminReply)) &&
    matchesSearch(search, a.id, targetLabel(a), a.type, a.title, a.message, a.date, a.adminReply)
  );

  const handleCreate = async (payload) => {
    try {
      await dispatch(createEmployeeAnnouncement(payload)).unwrap();
      addToast('Announcement posted successfully.', 'success');
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      addToast('Failed to post announcement: ' + (err?.message || err), 'error');
      throw err;
    }
  };

  return (
    <div id="communication-view" className="view-section active">
      <h1 className="page-title">Communication Management</h1>
      <p className="page-subtitle">Send announcements and notifications to your assigned institutions.</p>

      <div style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn-primary" onClick={() => setIsAddOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>add</span>
          New Announcement
        </button>
      </div>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by ID, institution, title or message..."
          filters={[
            { label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: uniqueOptions(announcements, 'type') },
            { label: 'All Targets', value: targetFilter, onChange: setTargetFilter, options: uniqueOptions(announcements, targetLabel) },
            { label: 'All Replies', value: replyFilter, onChange: setReplyFilter, options: ['Replied', 'No Reply'] },
          ]}
          resultCount={visibleAnnouncements.length}
          totalCount={announcements.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Target Institution</th>
              <th>Type</th>
              <th>Title</th>
              <th>Message</th>
              <th>Date</th>
              <th>Replies</th>
            </tr>
          </thead>
          <tbody id="announcementsTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : visibleAnnouncements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {announcements.length === 0 ? 'No announcements sent yet.' : 'No announcements match your search or filters.'}
                </td>
              </tr>
            ) : (
              visibleAnnouncements.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.targetOrgId === 'ALL' ? <em>All Institutions (Broadcast)</em> : a.targetOrgId}</td>
                  <td><span className="badge">{a.type}</span></td>
                  <td><strong>{a.title}</strong></td>
                  <td style={{ maxWidth: '200px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.message || '—'}</td>
                  <td>{a.date}</td>
                  <td>
                    {a.adminReply ? (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => setViewTarget(a)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>
                          mark_unread_chat_alt
                        </span>{' '}
                        View Replies
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No replies yet</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Announcement Modal */}
      <AnnouncementModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        institutions={institutions}
      />

      {/* View Replies Modal */}
      <RepliesModal isOpen={Boolean(viewTarget)} onClose={() => setViewTarget(null)} announcement={viewTarget} />
    </div>
  );
}
