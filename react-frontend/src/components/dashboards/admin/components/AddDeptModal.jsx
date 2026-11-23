import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

/**
 * AddDeptModal Component
 * Controlled modal dialog to create a new department within the organization.
 */
export default function AddDeptModal({
  isOpen,
  onClose,
  onSubmit,
  departments = [],
  isSubmitting = false,
}) {
  const [deptName, setDeptName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDeptName('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setErrorMsg('');
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    const trimmed = deptName.trim();

    if (!trimmed) {
      setErrorMsg('Please enter a department name.');
      return;
    }
    if (!nameRegex.test(trimmed)) {
      setErrorMsg('Department name can only contain letters, spaces, hyphens and dots.');
      return;
    }

    const exists = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setErrorMsg('A department with this name already exists.');
      return;
    }

    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add department');
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      title="Create New Department"
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText={isSubmitting ? 'Creating...' : 'Create Department'}
    >
      {errorMsg && (
        <div
          style={{
            padding: '0.625rem 0.875rem',
            marginBottom: '1rem',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Department Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Electrical Engineering"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
          <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            Enter a unique department title for your organization.
          </small>
        </div>
      </div>
    </AdminModal>
  );
}
