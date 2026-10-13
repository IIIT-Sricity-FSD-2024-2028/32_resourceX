import React from 'react';

/**
 * Exact replica of repliesModal from employee.html
 */
export default function RepliesModal({ isOpen, onClose, announcement }) {
  if (!isOpen || !announcement) return null;

  const orgName =
    announcement.targetOrgId === 'ALL' ? 'Broadcast (All Institutions)' : announcement.targetOrgId;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Replies to Announcement</h3>
            <div id="repliesAnnTitle" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
              "{announcement.title}"
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <div id="repliesContainer" style={{ padding: '1.5rem' }}>
          {announcement.adminReply ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--primary-color)' }}>{orgName}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {announcement.adminReplyDate || announcement.date}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{announcement.adminReply}</p>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No replies received yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
