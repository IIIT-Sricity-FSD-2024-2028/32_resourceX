import React from 'react';

/**
 * Clean and readable toast notification component for the Registrar portal.
 * Displays temporary feedback messages (success, error, warning).
 */
export default function RegistrarToast({ toasts = [] }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '420px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        let bg = '#10b981';
        let icon = 'check_circle';

        if (isError) {
          bg = '#ef4444';
          icon = 'error';
        } else if (isWarning) {
          bg = '#f59e0b';
          icon = 'warning';
        }

        return (
          <div
            key={toast.id}
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: bg,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              pointerEvents: 'auto'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              {icon}
            </span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
