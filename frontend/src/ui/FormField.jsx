import React from 'react';
import { handleFieldChange } from '../utils/validation';

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  children,
  maxLength,
  style,
  ...props
}) {
  const hasError = touched && error;

  /**
   * Handler interne qui :
   *  1. Formate la valeur via handleFieldChange (majuscules, filtre caractères interdits, etc.)
   *  2. Préserve la position du curseur
   *  3. Appelle le onChange du parent avec un événement synthétique
   */
  const handleChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const formatted = handleFieldChange(name, rawValue);

    // Recalcul de la position curseur si des caractères ont été retirés
    const removed = rawValue.length - formatted.length;
    const selStart = Math.max(0, (input.selectionStart ?? rawValue.length) - removed);
    const selEnd   = Math.max(0, (input.selectionEnd   ?? rawValue.length) - removed);

    // Transmettre un événement synthétique avec la valeur formatée
    const syntheticEvent = {
      ...e,
      target: { ...input, name, value: formatted },
      currentTarget: { ...input, name, value: formatted },
    };

    if (onChange) onChange(syntheticEvent);

    // Restaurer le curseur après re-render React
    requestAnimationFrame(() => {
      if (input.setSelectionRange && document.activeElement === input) {
        try { input.setSelectionRange(selStart, selEnd); } catch (_) {}
      }
    });
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#1e293b',
            fontSize: '14px'
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {children || (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          autoCapitalize={
            ['nom','prenom','chrono','vin','immatriculation','code'].includes(name) ? 'characters' : 'none'
          }
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: hasError ? '2px solid #ef4444' : '1px solid #cbd5e1',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            boxSizing: 'border-box',
            backgroundColor: disabled ? '#f1f5f9' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          {...props}
        />
      )}

      {hasError && (
        <p
          id={`${name}-error`}
          style={{
            color: '#ef4444',
            fontSize: '12px',
            marginTop: '4px'
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
