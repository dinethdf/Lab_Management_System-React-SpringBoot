import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { FormTextarea } from './FormTextarea';

/**
 * ConfirmDialog — Confirmation modal for destructive or high-impact lab actions.
 *
 * Implements strict lab rules:
 * - If requiresReason is true, a textarea is rendered and the confirm button
 *   is disabled until minimum required characters (e.g. 10 chars) are entered.
 * - Supports 'danger' (red) and 'primary' (blue) action variants.
 * - Displays loading spinner on the confirm button when an async operation is underway.
 *
 * Props:
 *   isOpen            (boolean)   — Whether the dialog is displayed
 *   onClose           (function)  — Cancel callback
 *   onConfirm         (function)  — Confirm callback: (reason) => void
 *   title             (string)    — Dialog title (e.g. "Reject Sample?")
 *   message           (string)    — Explanatory warning text
 *   confirmLabel      (string)    — Confirm button label (default: "Confirm")
 *   cancelLabel       (string)    — Cancel button label (default: "Cancel")
 *   variant           ('danger'|'primary') — Action color theme (default: 'danger')
 *   requiresReason    (boolean)   — Whether a text reason is mandatory (default: false)
 *   reasonPlaceholder (string)    — Placeholder text for reason field
 *   minReasonLength   (number)    — Minimum character length for valid reason (default: 10)
 *   loading           (boolean)   — Disables controls and shows spinner during async submit
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requiresReason = false,
  reasonPlaceholder = 'Please provide a detailed reason...',
  minReasonLength = 10,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset reason state whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
    }
  }, [isOpen]);

  // Determine if confirm action is allowed
  const isReasonValid = !requiresReason || reason.trim().length >= minReasonLength;

  const handleConfirm = () => {
    if (!isReasonValid || loading) return;
    onConfirm(requiresReason ? reason.trim() : undefined);
  };

  const isDanger = variant === 'danger';

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="
          px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!isReasonValid || loading}
        className={`
          inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-xs
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isDanger
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }
        `}
      >
        {loading && (
          <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {confirmLabel}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {/* Warning Icon & Message */}
        <div className="flex items-start gap-3">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}
            `}
          >
            {isDanger ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1">
            {message && <p className="text-sm text-gray-600 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Mandatory Reason Input (if enabled) */}
        {requiresReason && (
          <div className="pt-2 border-t border-gray-100">
            <FormTextarea
              label="Reason / Clinical Note"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setTouched(true);
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              required
              disabled={loading}
              hint={
                requiresReason && reason.trim().length < minReasonLength
                  ? `Minimum ${minReasonLength} characters required (current: ${reason.trim().length})`
                  : undefined
              }
              error={
                touched && requiresReason && reason.trim().length < minReasonLength
                  ? `Please enter at least ${minReasonLength} characters explaining this action.`
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
