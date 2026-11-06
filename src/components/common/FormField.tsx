'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  id?: string;
  label: string;
  name?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  hint?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  register?: UseFormRegisterReturn;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  name,
  type = 'text',
  placeholder,
  hint,
  error,
  inputMode,
  autoComplete,
  maxLength,
  required = false,
  multiline = false,
  rows = 3,
  register,
  value,
  onChange,
  onBlur,
  disabled = false,
  children,
  className,
}: FormFieldProps) {
  const fieldName = name ?? register?.name ?? id ?? 'field';
  const inputId = id ?? `field-${fieldName}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const baseInputClass = cn(
    'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-placeholder transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50',
    error
      ? 'border-danger focus-visible:ring-danger'
      : 'border-border hover:border-border-hover'
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={inputId}
        className="block text-xs font-medium text-text-soft"
      >
        {label}
        {required && <span className="text-accent-text ml-1">*</span>}
      </label>

      {children ? (
        children
      ) : multiline ? (
        <textarea
          id={inputId}
          rows={rows}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(register ?? {
            name: fieldName,
            value,
            onChange,
            onBlur,
          })}
          className={cn(baseInputClass, 'min-h-[88px] resize-y')}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(register ?? {
            name: fieldName,
            value,
            onChange,
            onBlur,
          })}
          className={cn(baseInputClass, 'min-h-[44px]')}
        />
      )}

      {hint && !error && (
        <p id={hintId} className="text-[11px] text-text-soft/80">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-danger"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default FormField;
