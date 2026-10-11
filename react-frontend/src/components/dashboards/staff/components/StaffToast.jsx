import React from 'react';

/**
 * Toast notification component for Staff Operations Portal
 */
export default function StaffToast({ toasts = [] }) {
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
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';
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
            key={t.id}
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
              animation: 'staffFadeIn 0.2s ease',
              pointerEvents: 'auto'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              {icon}
            </span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
