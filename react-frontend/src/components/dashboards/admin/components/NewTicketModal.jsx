import React, { useState } from 'react';

/**
 * Exact replica of newTicketModal from admin.html lines 343-370
 */
export default function NewTicketModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show" id="newTicketModal" tabIndex="-1" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Raise Support Query</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form id="newTicketForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="ticketTitle"
                  placeholder="e.g. Login issue for users"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="ticketDesc"
                  rows="4"
                  placeholder="Describe the issue in detail..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Query'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
