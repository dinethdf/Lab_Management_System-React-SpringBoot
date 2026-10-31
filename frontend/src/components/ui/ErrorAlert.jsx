import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

/**
 * ErrorAlert — Displays an error message banner with optional Retry and Dismiss actions.
 *
 * Designed for lab environments where network or validation failures must be
 * immediately obvious and staff are given an actionable path to retry.
 *
 * Props:
 *   title     (string)   — Bold heading for the error (default: "Something went wrong")
 *   message   (string)   — Detailed description of what failed
 *   onRetry   (function) — Callback to retry the failed operation. If omitted, no button appears.
 *   onDismiss (function) — Callback to close/dismiss the banner. If omitted, no close icon appears.
 *   className (string)   — Extra classes for the outer alert box
 */
export const ErrorAlert = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`
        rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm
        transition-all duration-200 flex flex-col gap-3
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon & Message content */}
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-red-800">{title}</h4>
            {message && <p className="text-sm text-red-700 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Optional dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-700 p-1 rounded-md transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Action footer (e.g. Retry button) */}
      {onRetry && (
        <div className="flex justify-end pt-1 border-t border-red-100">
          <button
            type="button"
            onClick={onRetry}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-red-600 text-white hover:bg-red-700 active:bg-red-800
              focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
              transition-colors shadow-xs
            "
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};
