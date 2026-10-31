import React from 'react';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

/**
 * ResultValueCell — Specialized lab test result cell with high-visibility abnormality alerts.
 *
 * Implements strict lab UX rules:
 * - Abnormal values (HIGH/LOW) turn the entire cell red with bold text and directional arrows (↑ / ↓).
 * - Always displays the reference range alongside the value for immediate context.
 * - Normal values display a quiet green checkmark.
 * - Handles empty / pending results cleanly with a placeholder dash.
 *
 * Props:
 *   value      (string|number) — The entered test result value
 *   unit       (string)        — Measurement unit (e.g., 'g/dL', 'mg/dL', 'x10^9/L')
 *   lowerLimit (number)        — Reference range lower bound
 *   upperLimit (number)        — Reference range upper bound
 *   flag       (string)        — Explicit flag from backend ('NORMAL' | 'HIGH' | 'LOW').
 *                                If not provided, it is calculated from limits if numeric.
 *   className  (string)        — Extra styling for outer cell container
 */
export const ResultValueCell = ({
  value,
  unit = '',
  lowerLimit,
  upperLimit,
  flag,
  className = '',
}) => {
  // If no value is entered yet
  if (value === null || value === undefined || value === '') {
    return (
      <div className={`text-gray-400 text-sm font-normal py-1 px-2 ${className}`}>
        —
      </div>
    );
  }

  // Determine abnormal flag
  let computedFlag = (flag || '').toUpperCase();
  const numValue = parseFloat(value);

  if (!computedFlag && !isNaN(numValue)) {
    if (typeof lowerLimit === 'number' && numValue < lowerLimit) {
      computedFlag = 'LOW';
    } else if (typeof upperLimit === 'number' && numValue > upperLimit) {
      computedFlag = 'HIGH';
    } else if (typeof lowerLimit === 'number' || typeof upperLimit === 'number') {
      computedFlag = 'NORMAL';
    }
  }

  const isHigh = computedFlag === 'HIGH';
  const isLow = computedFlag === 'LOW';
  const isAbnormal = isHigh || isLow;

  const hasReferenceRange = lowerLimit !== undefined || upperLimit !== undefined;
  const rangeText = hasReferenceRange
    ? `${lowerLimit !== undefined ? lowerLimit : ''} – ${upperLimit !== undefined ? upperLimit : ''}`
    : null;

  return (
    <div
      className={`
        flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg transition-colors
        ${isAbnormal
          ? 'bg-red-50 border border-red-200 text-red-900'
          : 'bg-transparent text-gray-800'
        }
        ${className}
      `}
    >
      {/* Value & Unit */}
      <div className="flex items-baseline gap-1.5">
        <span className={`text-sm ${isAbnormal ? 'font-bold text-red-700' : 'font-medium'}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-xs ${isAbnormal ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {unit}
          </span>
        )}
      </div>

      {/* Flag Indicator & Reference Range */}
      <div className="flex items-center gap-2">
        {isHigh && (
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
            <ArrowUp size={12} strokeWidth={3} />
            HIGH
          </span>
        )}

        {isLow && (
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
            <ArrowDown size={12} strokeWidth={3} />
            LOW
          </span>
        )}

        {!isAbnormal && computedFlag === 'NORMAL' && (
          <span className="text-green-600" title="Normal Range">
            <Check size={14} strokeWidth={2.5} />
          </span>
        )}

        {rangeText && (
          <span className={`text-xs ${isAbnormal ? 'text-red-600/80' : 'text-gray-400'}`}>
            ({rangeText})
          </span>
        )}
      </div>
    </div>
  );
};
