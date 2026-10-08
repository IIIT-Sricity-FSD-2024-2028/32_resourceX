import React, { useState } from 'react';

export default function AddDeptModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    head: '',
    memberCount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        head: formData.head,
        memberCount: Number(formData.memberCount) || 1
      });
      onClose();
    } catch {
      // Handled by parent toast
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
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Add Organizational Division</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Department Name</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Research & Innovation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Department Head Name</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Dr. Robert Vance"
              value={formData.head}
              onChange={(e) => setFormData({ ...formData, head: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Estimated Member Count</label>
            <input
              type="number"
              className="form-control"
              placeholder="10"
              value={formData.memberCount}
              onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Division'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
