import React, { useState, useMemo } from 'react';
import { Search, Info } from 'lucide-react';
import { Badge } from './Badge';

/**
 * TestCheckboxList — Specialized scrollable test selection list with built-in instant filtering.
 *
 * Implements strict lab UX rules:
 * - Built specifically for test ordering: shows code, name, category, and price.
 * - Minimum touch target size (w-5 h-5 checkbox) for tablets on lab collection benches.
 * - Prevents ordering when disabled (e.g., no patient selected) and explains why with an alert.
 * - Shows instantaneous live count badge of selected tests.
 * - Skeletons displayed during catalog loading.
 *
 * Props:
 *   tests     (Array)     — Catalog tests: [{ id, code, name, category, price }]
 *   selected  (Array)     — Array of selected test IDs
 *   onChange  (function)  — Callback receiving updated IDs array: (newIds) => void
 *   disabled  (boolean)   — If true, locks all checkboxes and shows guidance banner
 *   loading   (boolean)   — Shows animated placeholder skeleton rows
 *   className (string)    — Container extra classes
 */
export const TestCheckboxList = ({
  tests = [],
  selected = [],
  onChange,
  disabled = false,
  loading = false,
  className = '',
}) => {
  const [filterText, setFilterText] = useState('');

  // Filter tests locally by code, name, or category
  const filteredTests = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return tests;

    return tests.filter(
      (t) =>
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }, [tests, filterText]);

  // Handle single toggle
  const handleToggle = (id) => {
    if (disabled || !onChange) return;

    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  // Select all visible / Deselect all
  const handleSelectAllVisible = () => {
    if (disabled || !onChange) return;
    const visibleIds = filteredTests.map((t) => t.id);
    const allSelected = visibleIds.every((id) => selected.includes(id));

    if (allSelected) {
      onChange(selected.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selected, ...visibleIds]));
      onChange(merged);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Guidance banner when disabled */}
      {disabled && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span>Please select or register a patient first before selecting tests.</span>
        </div>
      )}

      {/* Filter Header */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter tests by name, code, category..."
            disabled={disabled || loading}
            className="
              w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs text-gray-800
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
        </div>

        {filteredTests.length > 0 && !disabled && !loading && (
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
          >
            Select visible
          </button>
        )}
      </div>

      {/* Scrollable Test List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          // Skeleton loading rows
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="w-12 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTests.length > 0 ? (
          filteredTests.map((test) => {
            const isChecked = selected.includes(test.id);

            return (
              <label
                key={test.id}
                className={`
                  flex items-center justify-between p-3 transition-colors select-none
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'}
                  ${isChecked ? 'bg-blue-50/50' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(test.id)}
                    disabled={disabled}
                    className="
                      w-5 h-5 rounded border-gray-300 text-blue-600
                      focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed
                    "
                  />
                  <div>
                    <span className="font-semibold text-xs text-gray-900 mr-2">
                      {test.code}
                    </span>
                    <span className="text-sm text-gray-700">
                      {test.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {test.category && (
                    <Badge variant="blue" className="text-[11px]">
                      {test.category}
                    </Badge>
                  )}
                  {test.price !== undefined && (
                    <span className="text-xs font-semibold text-gray-700 ml-1">
                      Rs. {test.price}
                    </span>
                  )}
                </div>
              </label>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-gray-400">
            No tests match "{filterText}"
          </div>
        )}
      </div>

      {/* Selected count footer */}
      <div className="p-2.5 px-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <span>Total Available: {tests.length}</span>
        <span className="font-semibold text-blue-600">
          {selected.length} test{selected.length === 1 ? '' : 's'} selected
        </span>
      </div>
    </div>
  );
};
