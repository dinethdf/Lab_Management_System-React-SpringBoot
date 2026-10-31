import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — Reusable overlay dialog for forms, wizards, and detail views.
 *
 * Implements strict lab UX rules:
 * 1. Default prevents backdrop click from closing the modal to avoid losing form data.
 * 2. Header and footer stay pinned while body scrolls if content exceeds viewport.
 * 3. Escape key support (can be optionally disabled).
 *
 * Props:
 *   isOpen               (boolean)   — Whether the modal is currently rendered
 *   onClose              (function)  — Triggered by the close (X) icon or Cancel action
 *   title                (string)    — Modal header title
 *   children             (ReactNode) — Modal body content
 *   footer               (ReactNode) — Fixed footer button row (e.g. Cancel + Submit)
 *   size                 ('sm'|'md'|'lg'|'xl') — Width constraint (default: 'md')
 *   preventBackdropClose (boolean)   — If true, clicking the dark background does NOT dismiss (default: true)
 *   preventEscapeClose   (boolean)   — If true, pressing Escape does NOT dismiss (default: false)
 *   className            (string)    — Extra classes for dialog card
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  preventBackdropClose = true,
  preventEscapeClose = false,
  className = '',
}) => {
  // Listen for Escape key press to dismiss modal
  useEffect(() => {
    if (!isOpen || preventEscapeClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, preventEscapeClose, onClose]);

  // Prevent background scrolling while modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Max width mapping based on size prop
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleBackdropClick = (e) => {
    // Only close if user clicked directly on the overlay, not inside the modal card
    if (e.target === e.currentTarget && !preventBackdropClose && onClose) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-xs transition-opacity duration-200
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          flex flex-col w-full bg-white rounded-2xl shadow-xl border border-gray-100
          max-h-[90vh] overflow-hidden transition-all transform duration-200
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body (Scrollable if content overflows) */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Modal Footer (Pinned to bottom if provided) */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
