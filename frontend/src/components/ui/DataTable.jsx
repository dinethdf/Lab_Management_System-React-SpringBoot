import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { EmptyState } from './EmptyState';

/**
 * DataTable — Standardized data table with loading skeletons, empty state, and column controls.
 *
 * Upgraded with:
 * - loading prop: shows animated skeleton rows to avoid layout shifts.
 * - emptyState prop: renders an instructional EmptyState component when data is empty.
 * - showActions prop: hides the Actions column for read-only tables (e.g. verification queues).
 * - showCheckboxes prop: defaults to false (only shows checkboxes when multi-select is enabled).
 *
 * Props:
 *   columns        (Array)     — Column definitions: [{ header, accessor, cell?: (row) => ReactNode }]
 *   data           (Array)     — Rows data array
 *   loading        (boolean)   — Displays 5 animated placeholder skeleton rows
 *   emptyState     (ReactNode) — Custom empty state element (falls back to default EmptyState)
 *   showActions    (boolean)   — Controls whether the Actions column is rendered (default: true)
 *   showCheckboxes (boolean)   — Shows row selection checkboxes (default: false)
 *   onView         (function)  — View action callback: (row) => void
 *   onEdit         (function)  — Edit action callback: (row) => void
 *   onDelete       (function)  — Delete action callback: (row) => void
 *   className      (string)    — Extra classes for container
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyState,
  showActions = true,
  showCheckboxes = false,
  onView,
  onEdit,
  onDelete,
  className = '',
}) => {
  const hasActions = showActions && Boolean(onView || onEdit || onDelete);

  return (
    <div className={`overflow-x-auto bg-white rounded-xl shadow-xs border border-gray-100 ${className}`}>
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 border-b border-gray-100">
          <tr>
            {showCheckboxes && (
              <th scope="col" className="p-4 w-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
            )}

            {columns.map((col, idx) => (
              <th key={idx} scope="col" className="px-6 py-4 font-semibold tracking-wider">
                {col.header}
              </th>
            ))}

            {hasActions && (
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            // Skeleton loading rows
            [1, 2, 3, 4, 5].map((skeletonIdx) => (
              <tr key={skeletonIdx} className="border-b border-gray-50 animate-pulse">
                {showCheckboxes && (
                  <td className="w-4 p-4">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                  </td>
                )}
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                ))}
                {hasActions && (
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                  </td>
                )}
              </tr>
            ))
          ) : data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="bg-white border-b border-gray-50 hover:bg-gray-50/80 transition-colors"
              >
                {showCheckboxes && (
                  <td className="w-4 p-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                )}

                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}

                {hasActions && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            // Empty state row
            <tr>
              <td
                colSpan={columns.length + (showCheckboxes ? 1 : 0) + (hasActions ? 1 : 0)}
                className="p-8 text-center"
              >
                {emptyState || (
                  <EmptyState
                    title="No records available"
                    description="No entries have been added to this view yet."
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">
            Showing 1 to {data.length} of {data.length} entries
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-400 bg-white cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-400 bg-white cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
