import React from 'react';

export function Card({ children, variant = 'default', ...props }) {
  const styles = {
    default: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    outlined: {
      background: 'transparent',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
    }
  };

  return (
    <div style={styles[variant]} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, ...props }) {
  return <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }} {...props}>{children}</div>;
}

export function CardBody({ children, ...props }) {
  return <div style={{ color: '#475569' }} {...props}>{children}</div>;
}

export function CardFooter({ children, ...props }) {
  return <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }} {...props}>{children}</div>;
}
