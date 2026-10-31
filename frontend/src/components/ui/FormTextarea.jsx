import React from 'react';

/**
 * FormTextarea — A reusable multi-line text input field.
 *
 * Primarily used for rejection reasons, amendment notes, and descriptions.
 * Shows a red "*" next to the label when required.
 * Displays character counter (current / max) when maxLength is provided.
 * Displays inline validation error below the field.
 *
 * Props:
 *   label       (string)   — Label text shown above the textarea
 *   value       (string)   — Controlled value
 *   onChange    (function) — onChange handler: (e) => ...
 *   onBlur      (function) — onBlur handler: (e) => ...
 *   error       (string)   — Validation error message (shown in red)
 *   hint        (string)   — Helper text shown in grey below
 *   rows        (number)   — Number of visible text lines (default: 3)
 *   placeholder (string)   — Placeholder text
 *   maxLength   (number)   — Maximum allowed character count
 *   required    (boolean)  — Shows red * next to label
 *   disabled    (boolean)  — Greyed out, not editable
 *   id          (string)   — HTML id (auto-generated from label if omitted)
 *   className   (string)   — Extra classes for outer wrapper
 */
export const FormTextarea = ({
  label,
  value = '',
  onChange,
  onBlur,
  error,
  hint,
  rows = 3,
  placeholder = '',
  maxLength,
  required = false,
  disabled = false,
  id,
  className = '',
  ...rest
}) => {
  // Generate a stable id from the label if none is provided
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'textarea');

  const currentLength = (value || '').length;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label and Character Count Header */}
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Character counter (if maxLength is set) */}
        {maxLength && (
          <span className="text-xs text-gray-400">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      {/* Textarea Input */}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-gray-800
          placeholder-gray-400 transition-colors resize-y
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
        {...rest}
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Helper text */}
      {!error && hint && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
};
