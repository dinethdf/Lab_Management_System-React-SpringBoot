import React, { useState, useRef, useEffect } from 'react';
import { Scan, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * BarcodeInput — High-speed scanner-optimized input field for lab barcode / QR workflows.
 *
 * Implements strict lab UX rules:
 * - Scanners emulate rapid keyboard input terminating in an Enter keypress.
 * - Automatically auto-focuses on mount without technician manual clicking.
 * - Submits immediately upon Enter and locks during API verification to prevent duplicate scans.
 * - Displays an unmistakable animated dashed border signaling "Ready to scan".
 * - Flashes a green confirmation ring upon successful scan and auto-clears for the next specimen.
 * - Can also be operated manually via standard keyboard typing.
 *
 * Props:
 *   label       (string)   — Field heading (e.g. "Scan Container Barcode")
 *   onScan      (function) — Callback invoked when Enter is pressed with valid string: (code) => void
 *   loading     (boolean)  — Locks input and indicates server lookup in progress
 *   error       (string)   — Error message displayed below input
 *   clearOnScan (boolean)  — Whether to clear input value after triggering onScan (default: true)
 *   disabled    (boolean)  — Disables input field
 *   hint        (string)   — Helpful text shown below input
 *   prefix      (string)   — Optional visual prefix badge (e.g. "TSC-")
 *   className   (string)   — Extra classes for container
 */
export const BarcodeInput = ({
  label = 'Scan Barcode',
  onScan,
  loading = false,
  error,
  clearOnScan = true,
  disabled = false,
  hint = 'Scan container barcode or type code and press Enter',
  prefix,
  className = '',
}) => {
  const [value, setValue] = useState('');
  const [successFlash, setSuccessFlash] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled && !loading) {
      inputRef.current.focus();
    }
  }, [disabled, loading]);

  // Handle Enter keypress (scanner completion event)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = value.trim();
      if (!code || loading || disabled) return;

      if (onScan) {
        onScan(code);
      }

      // Visual success confirmation flash
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 1200);

      if (clearOnScan) {
        setValue('');
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Scanner Ready
          </span>
        </label>
      )}

      {/* Barcode Input Container */}
      <div className="relative flex items-center">
        {/* Scanner Icon */}
        <div className="absolute left-3.5 text-blue-600 pointer-events-none">
          <Scan size={18} />
        </div>

        {/* Optional Code Prefix */}
        {prefix && (
          <span className="absolute left-10 text-xs font-mono font-bold text-gray-400 select-none">
            {prefix}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="Waiting for scan or manual entry..."
          className={`
            w-full rounded-xl py-3 pl-10 pr-10 text-sm font-mono tracking-wider
            transition-all duration-200 focus:outline-none
            ${prefix ? 'pl-20' : 'pl-10'}
            ${loading
              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
              : successFlash
              ? 'bg-green-50 border-green-500 ring-4 ring-green-100 text-green-900 font-bold'
              : error
              ? 'bg-red-50 border-red-400 ring-2 ring-red-200 text-red-900'
              : 'bg-white border-2 border-dashed border-blue-400 hover:border-blue-600 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
            }
          `}
        />

        {/* Status Feedback in Right Corner */}
        <div className="absolute right-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 size={18} className="text-blue-600 animate-spin" />
          ) : successFlash ? (
            <CheckCircle2 size={18} className="text-green-600" />
          ) : null}
        </div>
      </div>

      {/* Error or Hint Output */}
      {error ? (
        <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-0.5">
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-400 mt-0.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
