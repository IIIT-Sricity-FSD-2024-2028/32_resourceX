import React, { useState, useEffect } from 'react';

/**
 * Exact replica of replyAnnModal from admin.html lines 386-411
 */
export default function ReplyAnnModal({ isOpen, onClose, onSubmit, announcement }) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (announcement) {
      setReplyText(announcement.reply || '');
    }
  }, [announcement]);

  if (!isOpen || !announcement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(announcement.id, replyText.trim());
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show" id="replyAnnModal" tabIndex="-1" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reply to Announcement</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div
              id="replyAnnDetails"
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                fontSize: '0.875rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <strong>{announcement.type}:</strong> {announcement.title}
              <br />
              <span style={{ color: '#64748b' }}>{announcement.message || ''}</span>
            </div>
            <form id="replyAnnForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Reply / Acknowledgement</label>
                <textarea
                  className="form-control"
                  id="replyAnnText"
                  rows="4"
                  placeholder="Write your reply here..."
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
