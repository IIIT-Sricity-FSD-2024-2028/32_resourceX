import React from 'react';

/**
 * Confirmation modal (same look as the custom modal in employee.html / AdminModal)
 */
export default function EmployeeModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  confirmButtonClass = 'btn-primary',
  children
}) {
  if (!isOpen) return null;

  return (
    <div
      id="employee-modal"
      className="modal-overlay"
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="modal-header"
          style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}
        >
          {title}
        </div>
        <div id="modal-body" style={{ marginBottom: '1.5rem' }}>
          {children}
        </div>
        <div id="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {onConfirm && (
            <button
              type="button"
              className={confirmButtonClass}
              id="modal-confirm-btn"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
