import React from 'react';

/**
 * FormSelect — A reusable dropdown select field.
 *
 * Always shows a default "— Select —" placeholder option so staff cannot
 * accidentally submit a blank value. Supports required validation error display.
 *
 * Props:
 *   label       (string)            — Label text above the select
 *   value       (string)            — Controlled selected value
 *   onChange    (function)          — onChange handler: (e) => ...
 *   options     ([{value, label}])  — Array of option objects
 *   error       (string)            — Validation error message (shown in red)
 *   required    (boolean)           — Shows red * next to label
 *   disabled    (boolean)           — Greyed out, not clickable
 *   placeholder (string)            — Placeholder option text (default: "— Select —")
 *   id          (string)            — HTML id
 *   className   (string)            — Extra class for wrapper div
 */
export const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = '— Select —',
  id,
  className = '',
  ...rest
}) => {
  // Generate a stable id from the label if none is provided
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'select');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label row */}
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {/* Red asterisk for required fields */}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select dropdown */}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-gray-800
          transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
        {...rest}
      >
        {/* Default placeholder option — always shown first */}
        <option value="" disabled>
          {placeholder}
        </option>

        {/* Map over provided options */}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Validation error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};
