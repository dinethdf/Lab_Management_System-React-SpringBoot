import React from 'react';
import { useToast } from '../../../context/ToastContext';
import { ToastItem } from './ToastItem';

/**
 * ToastContainer — Anchors toast alerts to the upper-right corner of the viewport.
 *
 * Designed with pointer-events-none on the container so clicks pass through to the page,
 * while pointer-events-auto on each individual toast allows users to click the close button.
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
