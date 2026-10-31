import React from 'react';

/**
 * PageHeader — Standardized page title, tab navigation, and action header bar.
 *
 * Provides a clean, professional banner at the top of main views with optional
 * filter tabs and right-aligned action buttons (such as "+ Add Test" or "Export").
 *
 * Props:
 *   title       (string)    — Main page heading
 *   subtitle    (string)    — Optional description or subtitle
 *   tabs        (Array)     — Array of objects: [{ label, value, count }]
 *   activeTab   (string)    — Currently active tab value
 *   onTabChange (function)  — Tab selection callback: (tabValue) => void
 *   actions     (ReactNode) — Right-side action buttons JSX
 *   className   (string)    — Extra container styling
 */
export const PageHeader = ({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-4 bg-white rounded-xl shadow-xs border border-gray-100 p-6 mb-6 ${className}`}>
      {/* Title & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Filter Tabs Row (if tabs are provided) */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-2 border-b border-gray-100 pt-2 -mb-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.value)}
                className={`
                  inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2
                  transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
