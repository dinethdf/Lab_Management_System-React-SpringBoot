import React from 'react';
import { FileQuestion } from 'lucide-react';

/**
 * EmptyState — Instructional placeholder displayed when a list or queue has no items.
 *
 * Rather than a blank screen or a vague "No data", this guides lab personnel on
 * what the view is for and what action to take next.
 *
 * Props:
 *   title       (string)    — Main summary message (e.g., "No Tests Configured")
 *   description (string)    — Guiding explanation on what to do next
 *   icon        (ReactNode) — Lucide icon component or element (defaults to FileQuestion)
 *   actionLabel (string)    — Text for the primary call-to-action button
 *   onAction    (function)  — Click handler for the CTA button
 *   className   (string)    — Wrapper styling overrides
 */
export const EmptyState = ({
  title = 'No records found',
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        p-8 md:p-12 bg-white rounded-xl border border-dashed border-gray-200
        ${className}
      `}
    >
      {/* Icon illustration container */}
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        {icon ? icon : <FileQuestion size={24} />}
      </div>

      {/* Main heading */}
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        {title}
      </h3>

      {/* Guiding description */}
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Optional action CTA */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="
            inline-flex items-center justify-center px-4 py-2 rounded-lg
            text-sm font-medium bg-blue-600 text-white hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            shadow-sm transition-colors
          "
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
