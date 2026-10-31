import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * FormInput — A reusable, accessible text input field.
 *
 * Supports all common HTML input types (text, email, password, number, date, tel).
 * Shows a red "*" next to the label when the field is required.
 * Displays an inline validation error below the field (red text).
 * Displays a grey hint/helper text below when no error is present.
 * Supports autoFocus for scanner-optimized screens.
 * Calls onEnter when the Enter key is pressed (for barcode auto-submit workflows).
 * Includes an Eye toggle icon when type is 'password' to show/hide plaintext.
 *
 * Props:
 *   label       (string)   — Label text shown above the input
 *   type        (string)   — Input type: text, email, password, number, date, tel
 *   value       (string)   — Controlled value
 *   onChange    (function) — onChange handler: (e) => ...
 *   onBlur      (function) — onBlur handler: (e) => ...
 *   error       (string)   — Validation error message (shown in red below input)
 *   hint        (string)   — Helper text shown in grey below (hidden if error is present)
 *   required    (boolean)  — Shows red * next to label
 *   disabled    (boolean)  — Greyed out, not editable
 *   autoFocus   (boolean)  — Focuses this field automatically on mount
 *   onEnter     (function) — Called when the user presses Enter
 *   placeholder (string)   — Placeholder text
 *   id          (string)   — HTML id (auto-generated from label if not provided)
 *   className   (string)   — Extra class for the wrapper div
 */
export const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  required = false,
  disabled = false,
  autoFocus = false,
  onEnter,
  placeholder = '',
  id,
  className = '',
  ...rest
}) => {
  // Toggle password visibility if this is a password input field
  const [showPassword, setShowPassword] = useState(false);

  // Generate a stable id from the label if none is provided
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'input');

  // Handle Enter key press — useful for scanner auto-submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter(e);
    }
  };

  // Determine actual HTML input type (handles password toggling)
  const actualType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label row */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {/* Red asterisk for required fields */}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm text-gray-800
            placeholder-gray-400 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
            ${type === 'password' ? 'pr-10' : ''}
            ${error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
          `}
          {...rest}
        />

        {/* Password visibility toggle button */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Error message (shown in red when present) */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Hint/helper text (shown in grey when no error) */}
      {!error && hint && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
};
