import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * ToastItem — Represents an individual toast card positioned in the upper right.
 *
 * Features:
 * - Specific iconography and colors for success, error, warning, and info.
 * - Auto-dismiss countdown progress bar.
 * - Manual close button.
 * - Smooth CSS slide-in and hover pause.
 */
export const ToastItem = ({ toast, onDismiss }) => {
  const { id, type = 'info', title, message, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Configuration for each notification type
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      borderColor: 'border-emerald-200',
      bgColor: 'bg-white',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-950',
      progressColor: 'bg-emerald-500',
      defaultTitle: 'Success',
    },
    error: {
      icon: AlertCircle,
      borderColor: 'border-rose-200',
      bgColor: 'bg-white',
      iconColor: 'text-rose-600',
      titleColor: 'text-rose-950',
      progressColor: 'bg-rose-500',
      defaultTitle: 'Error',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-amber-200',
      bgColor: 'bg-white',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-950',
      progressColor: 'bg-amber-500',
      defaultTitle: 'Warning',
    },
    info: {
      icon: Info,
      borderColor: 'border-blue-200',
      bgColor: 'bg-white',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-950',
      progressColor: 'bg-blue-500',
      defaultTitle: 'Information',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  // Progress bar countdown timer (smoothly decreases from 100% to 0%)
  useEffect(() => {
    if (!duration || duration <= 0 || isPaused) return;

    const intervalTime = 50; // update every 50ms
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isPaused]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        pointer-events-auto relative overflow-hidden w-full max-w-sm rounded-xl border shadow-lg
        ${config.borderColor} ${config.bgColor} p-4 transition-all duration-300
        transform translate-y-0 opacity-100 hover:shadow-xl
      `}
      style={{
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className={`text-xs font-bold leading-tight ${config.titleColor}`}>
            {title || config.defaultTitle}
          </h4>
          {message && (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">
              {message}
            </p>
          )}
        </div>

        {/* Manual Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown progress bar at bottom */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className={`h-full ${config.progressColor} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ToastItem;
