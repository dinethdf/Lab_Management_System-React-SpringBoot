import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

/**
 * SuccessAlert — Confirmation alert banner with auto-dismiss and progress countdown.
 *
 * Appears at the top of pages or cards to give positive feedback after
 * saving, approving, or submitting lab data.
 *
 * Props:
 *   title       (string)   — Bold heading (default: "Done!")
 *   message     (string)   — Confirmation message
 *   autoDismiss (number)   — Duration in seconds before auto-hiding (default: 4, 0 = never auto-hide)
 *   onDismiss   (function) — Called when the alert is dismissed manually or automatically
 *   className   (string)   — Extra classes for container
 */
export const SuccessAlert = ({
  title = 'Done!',
  message,
  autoDismiss = 4,
  onDismiss,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, autoDismiss * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible) return null;

  const handleManualDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-green-200 bg-green-50
        p-4 text-green-900 shadow-sm transition-all duration-300
        ${className}
      `}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-green-800">{title}</h4>
            {message && <p className="text-sm text-green-700 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Manual close button */}
        <button
          type="button"
          onClick={handleManualDismiss}
          className="text-green-400 hover:text-green-700 p-1 rounded-md transition-colors"
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      </div>

      {/* Visual countdown progress bar */}
      {autoDismiss > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-200">
          <div
            className="h-full bg-green-500 transition-all"
            style={{
              animation: `shrinkWidth ${autoDismiss}s linear forwards`,
            }}
          />
          <style>{`
            @keyframes shrinkWidth {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
