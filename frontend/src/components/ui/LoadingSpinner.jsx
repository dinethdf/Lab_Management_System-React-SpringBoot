import React from 'react';

/**
 * LoadingSpinner — A reusable, animated loading indicator.
 *
 * Can be rendered as a full-area centered block or inline inside buttons/table cells.
 *
 * Props:
 *   message   (string)     — Optional text displayed below or next to the spinner
 *   size      ('sm'|'md'|'lg') — Size of the spinner ring (default: 'md')
 *   inline    (boolean)    — If true, renders inline horizontally; if false, renders centered block
 *   className (string)     — Additional wrapper classes
 */
export const LoadingSpinner = ({
  message,
  size = 'md',
  inline = false,
  className = '',
}) => {
  // Map size prop to Tailwind dimensions and border widths
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinnerRing = (
    <div
      className={`
        rounded-full border-gray-200 border-t-blue-600 animate-spin
        ${sizeClasses[size] || sizeClasses.md}
      `}
      role="status"
      aria-label="Loading"
    />
  );

  // Inline layout (e.g. inside a button or table cell)
  if (inline) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {spinnerRing}
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </span>
    );
  }

  // Block layout (e.g. loading a page or card section)
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 gap-3 text-center ${className}`}>
      {spinnerRing}
      {message && <p className="text-sm text-gray-500 font-medium">{message}</p>}
    </div>
  );
};
