import React from 'react';

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  ...props
}, ref) => {
  const baseStyles = {
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
    opacity: disabled ? 0.6 : 1,
  };

  const variants = {
    primary: { background: '#3b82f6', color: 'white' },
    success: { background: '#10b981', color: 'white' },
    danger: { background: '#ef4444', color: 'white' },
    ghost: { background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' }
  };

  return (
    <button
      ref={ref}
      style={{ ...baseStyles, ...variants[variant] }}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? '⏳ ' : ''}{children}
    </button>
  );
});

Button.displayName = 'Button';
