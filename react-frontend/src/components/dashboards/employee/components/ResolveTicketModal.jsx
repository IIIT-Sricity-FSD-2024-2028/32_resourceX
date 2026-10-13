import React, { useState, useEffect } from 'react';

/**
 * Exact replica of resolveTicketModal from employee.html
 */
export default function ResolveTicketModal({ isOpen, onClose, onSubmit, ticket }) {
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) setReply('');
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(ticket.id, reply.trim());
      onClose();
    } catch {
      // error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Resolve Support Ticket</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div
            id="ticketDetails"
            style={{ background: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem', padding: '1rem', marginBottom: '1rem' }}
          >
            <div style={{ marginBottom: '0.5rem' }}><strong>Ticket:</strong> {ticket.id}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Institution:</strong> {ticket.organizationId}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Title:</strong> {ticket.title}</div>
            <div><strong>Description:</strong> {ticket.description || '—'}</div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Reply / Resolution Note</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Describe how the issue was resolved..."
              required
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reply & Mark Resolved'}
          </button>
        </form>
      </div>
    </div>
  );
}
