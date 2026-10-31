import React from 'react';

/**
 * Badge — Reusable status and category pill component.
 *
 * Upgraded with additional medical and administrative color variants:
 * - gray, blue, green, red, orange
 * - purple (admin/received), amber/yellow (pending), indigo (technician)
 *
 * Props:
 *   children  (ReactNode) — Pill label text or count
 *   variant   (string)    — Color theme
 *   className (string)    — Extra classes
 */
export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-800 border border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border border-blue-200',
    green: 'bg-green-100 text-green-800 border border-green-200',
    red: 'bg-red-100 text-red-800 border border-red-200',
    orange: 'bg-orange-100 text-orange-800 border border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
    amber: 'bg-amber-100 text-amber-800 border border-amber-200',
    yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    indigo: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${variants[variant] || variants.gray}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
