import React from 'react';

export default function EmployeeToast({ toasts = [] }) {
  if (!toasts.length) return null;

  return (
    <div
      id="toast-container"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: t.type === 'error' ? '#ef4444' : '#10b981',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
