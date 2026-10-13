import React, { useState } from 'react';

const TYPES = [
  { value: 'General', label: 'General' },
  { value: 'Maintenance', label: 'Scheduled Maintenance' },
  { value: 'New Feature', label: 'New Feature' },
  { value: 'Policy', label: 'Policy Update' },
  { value: 'Subscription', label: 'Subscription Reminder' }
];

const EMPTY_FORM = { targetOrgId: 'ALL', type: 'General', title: '', message: '' };

/**
 * Exact replica of announcementModal from employee.html
 */
export default function AnnouncementModal({ isOpen, onClose, onSubmit, institutions = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Create Announcement</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Target Institution</label>
            <select className="form-control" required value={form.targetOrgId} onChange={set('targetOrgId')}>
              <option value="ALL">All My Institutions (Broadcast)</option>
              {institutions.map((org) => (
                <option key={org.id} value={org.id}>{org.name} ({org.id})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Type</label>
            <select className="form-control" required value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Scheduled downtime on Sunday"
              value={form.title}
              onChange={set('title')}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Message</label>
            <textarea
              className="form-control"
              rows="4"
              required
              placeholder="Write your message here..."
              value={form.message}
              onChange={set('message')}
            ></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}
