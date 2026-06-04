import React from 'react';

export function Alert({ type = 'info', children, onClose, ...props }) {
  const styles = {
    success: { background: '#ecfdf5', border: '1px solid #d1fae5', color: '#065f46' },
    error: { background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b' },
    warning: { background: '#fefce8', border: '1px solid #fef3c7', color: '#92400e' },
    info: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div
      style={{
        ...styles[type],
        padding: '16px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}
      role="alert"
      {...props}
    >
      <span>{icons[type]} {children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
