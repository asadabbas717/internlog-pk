import type { HTMLInputTypeAttribute } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  multiline?: boolean;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number;
  maxLength?: number;
  hint?: string;
  error?: string | undefined;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  required = false,
  min,
  max,
  step,
  maxLength,
  hint,
  error,
}: Props) {
  const common = {
    id,
    name: id,
    value,
    required,
    maxLength,
    'aria-invalid': Boolean(error),
    'aria-describedby':
      [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
        .filter(Boolean)
        .join(' ') || undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {!required && <span className="optional"> · optional</span>}
      </label>
      {multiline ? (
        <textarea
          {...common}
          rows={3}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      ) : (
        <input
          {...common}
          type={type}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
