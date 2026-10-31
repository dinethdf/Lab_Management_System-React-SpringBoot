import React, { createContext, useContext, useState, useCallback } from 'react';

// Create React Context for Toast Notifications
const ToastContext = createContext(null);

/**
 * ToastProvider — Wraps the application to provide global, upper-right toast notifications.
 *
 * Beginner-friendly implementation using native React hooks:
 * - useState to track active toast items.
 * - useCallback for stable dismiss and show functions.
 * - No external dependencies or complicated redux stores needed.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Removes a specific toast by its unique ID
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  // Adds a toast item to the stack
  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast = {
        id,
        type, // 'success' | 'error' | 'warning' | 'info'
        title,
        message,
        duration,
        createdAt: Date.now(),
      };

      // Add newest toast at the top of the stack
      setToasts((prev) => [newToast, ...prev]);

      // Auto-dismiss timer if duration is specified
      if (duration && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  // Convenience helper: Success Toast (Green)
  const showSuccess = useCallback(
    (message, title = 'Success') => {
      return showToast({ type: 'success', title, message, duration: 4000 });
    },
    [showToast]
  );

  // Convenience helper: Error Toast (Red, slightly longer duration)
  const showError = useCallback(
    (message, title = 'Error') => {
      return showToast({ type: 'error', title, message, duration: 5000 });
    },
    [showToast]
  );

  // Convenience helper: Warning Toast (Amber)
  const showWarning = useCallback(
    (message, title = 'Warning') => {
      return showToast({ type: 'warning', title, message, duration: 4500 });
    },
    [showToast]
  );

  // Convenience helper: Information Toast (Blue)
  const showInfo = useCallback(
    (message, title = 'Information') => {
      return showToast({ type: 'info', title, message, duration: 4000 });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to easily trigger toasts from any component in the app.
 *
 * Example usage:
 * const { showSuccess, showError } = useToast();
 * showSuccess('Patient registered successfully!');
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return context;
};

export default ToastContext;
