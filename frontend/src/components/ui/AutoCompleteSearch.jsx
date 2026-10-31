import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, PlusCircle } from 'lucide-react';

/**
 * AutoCompleteSearch — Type-ahead live search with keyboard navigation and fallback actions.
 *
 * Implements strict lab UX rules:
 * - Mobile-first patient lookup: searches primarily on mobile / identifier with 300ms debounce.
 * - Truncates sensitive demographic info in dropdown (ID + Name, Contact).
 * - Keyboard navigation (Up/Down/Enter/Escape).
 * - Displays a prominent "+ Register new patient" action when search returns empty.
 * - Locks and displays an easily clearable chip after an item is selected.
 *
 * Props:
 *   label         (string)   — Label displayed above the search field
 *   placeholder   (string)   — Placeholder text
 *   onSearch      (function) — Async callback triggered with query: (query) => void
 *   suggestions   (Array)    — Results array: [{ id, primaryLabel, subLabel }]
 *   onSelect      (function) — Selection callback: (item) => void
 *   onNotFound    (function) — Callback when "+ Register new patient" option is clicked
 *   loading       (boolean)  — Shows search spinner inside input
 *   minChars      (number)   — Minimum characters before search fires (default: 3)
 *   notFoundLabel (string)   — Fallback button label (default: "+ Register new patient")
 *   disabled      (boolean)  — Locks the input
 *   className     (string)   — Extra classes for container
 */
export const AutoCompleteSearch = ({
  label,
  placeholder = 'Type to search...',
  onSearch,
  suggestions = [],
  onSelect,
  onNotFound,
  loading = false,
  minChars = 3,
  notFoundLabel = '+ Register new patient',
  disabled = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);

  const containerRef = useRef(null);

  // Debounce search trigger
  useEffect(() => {
    if (selectedItem) return;

    const trimmed = query.trim();
    if (trimmed.length >= minChars) {
      const timer = setTimeout(() => {
        if (onSearch) onSearch(trimmed);
        setIsOpen(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [query, minChars, onSearch, selectedItem]);

  // Handle outside clicks to close suggestion menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectItem(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setQuery(item.primaryLabel);
    setIsOpen(false);
    if (onSelect) onSelect(item);
  };

  const handleClear = () => {
    setSelectedItem(null);
    setQuery('');
    setHighlightedIndex(-1);
    setIsOpen(false);
    if (onSelect) onSelect(null);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400 pointer-events-none">
          <Search size={16} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedItem) setSelectedItem(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= minChars && !selectedItem) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled || Boolean(selectedItem)}
          className={`
            w-full rounded-lg border pl-9 pr-9 py-2 text-sm text-gray-800
            placeholder-gray-400 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-default
            border-gray-300 bg-white hover:border-gray-400
          `}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-3 flex items-center">
          {loading ? (
            <Loader2 size={16} className="text-blue-500 animate-spin" />
          ) : (query || selectedItem) && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && !selectedItem && (
        <div
          className="
            absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto
            bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-50
          "
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full text-left px-4 py-2.5 flex flex-col transition-colors
                  ${highlightedIndex === index ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-gray-50 text-gray-800'}
                `}
              >
                <span className="text-sm font-semibold">{item.primaryLabel}</span>
                {item.subLabel && (
                  <span className="text-xs text-gray-500 mt-0.5">{item.subLabel}</span>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-2">No matching records found</p>
              {onNotFound && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNotFound();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle size={14} />
                  <span>{notFoundLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
