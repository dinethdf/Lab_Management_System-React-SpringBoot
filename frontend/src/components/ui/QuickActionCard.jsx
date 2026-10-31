import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * QuickActionCard — Interactive action tile used across role dashboards.
 *
 * Provides a prominent, accessible shortcut to common technician & admin tasks
 * with cohesive medical-themed hover states, icons, and micro-copy.
 *
 * Props:
 *   title       (string)    — Primary action label (e.g. "Register Patient & Slip")
 *   description (string)    — Short explanatory sentence of what this action does
 *   icon        (LucideIcon)— Action icon component (e.g. Users, FileText, CheckCircle2)
 *   to          (string)    — Internal route to navigate to (e.g. "/reception")
 *   badge       (string)    — Optional status or pill tag (e.g. "Primary", "3 Urgent")
 *   color       (string)    — Theme color palette: 'blue' | 'teal' | 'indigo' | 'amber' | 'emerald'
 *   onClick     (function)  — Optional click handler if not using `to` link
 */
export const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  to,
  badge,
  color = 'blue',
  onClick,
}) => {
  // Color configuration matching LMS hospital theme
  const colorThemes = {
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      borderHover: 'hover:border-blue-200',
      titleHover: 'group-hover:text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    teal: {
      bgIcon: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
      borderHover: 'hover:border-teal-200',
      titleHover: 'group-hover:text-teal-600',
      badge: 'bg-teal-100 text-teal-800',
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      borderHover: 'hover:border-indigo-200',
      titleHover: 'group-hover:text-indigo-600',
      badge: 'bg-indigo-100 text-indigo-800',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      borderHover: 'hover:border-amber-200',
      titleHover: 'group-hover:text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      borderHover: 'hover:border-emerald-200',
      titleHover: 'group-hover:text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800',
    },
  };

  const theme = colorThemes[color] || colorThemes.blue;

  const content = (
    <div
      className={`group relative bg-white p-5 rounded-xl border border-gray-100 ${theme.borderHover} shadow-xs hover:shadow-md transition-all duration-200 flex items-start gap-4 cursor-pointer`}
      onClick={onClick}
    >
      {/* Icon with animated background on hover */}
      <div
        className={`p-3 rounded-xl ${theme.bgIcon} transition-colors duration-200 shrink-0`}
      >
        {Icon && <Icon size={22} />}
      </div>

      {/* Text Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`text-sm font-bold text-gray-900 ${theme.titleHover} transition-colors`}
          >
            {title}
          </h4>
          {badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Trailing arrow indicator */}
      <div className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all self-center">
        <ChevronRight size={18} />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

export default QuickActionCard;
