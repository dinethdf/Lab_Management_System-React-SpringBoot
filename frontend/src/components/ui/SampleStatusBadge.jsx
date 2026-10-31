import React from 'react';
import { Clock, Syringe, Building2, Edit3, CheckCircle, XCircle } from 'lucide-react';

/**
 * SampleStatusBadge — Standardized lifecycle status pill for samples and containers.
 *
 * Implements strict lab display rules:
 * - Each status has a unique, consistent color across all screens.
 * - Icon and label are always displayed together (accessible).
 * - REJECTED status triggers a subtle pulsing alert animation to demand immediate attention.
 *
 * Props:
 *   status    (string)    — Backend status enum string:
 *                           'PENDING_COLLECTION' | 'COLLECTED' | 'RECEIVED_AT_LAB' |
 *                           'RESULT_ENTERED' | 'VERIFIED' | 'REJECTED'
 *   size      ('sm'|'md') — Size variant ('sm' for dense tables, 'md' for cards)
 *   className (string)    — Optional styling override
 */
export const SampleStatusBadge = ({
  status,
  size = 'md',
  className = '',
}) => {
  // Normalize input status string
  const normalizedStatus = (status || '').toUpperCase().trim();

  // Configuration for each container lifecycle stage
  const config = {
    PENDING_COLLECTION: {
      label: 'Pending Collection',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      pulse: false,
    },
    COLLECTED: {
      label: 'Collected',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Syringe,
      pulse: false,
    },
    RECEIVED_AT_LAB: {
      label: 'Received at Lab',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Building2,
      pulse: false,
    },
    RESULT_ENTERED: {
      label: 'Result Entered',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Edit3,
      pulse: false,
    },
    VERIFIED: {
      label: 'Verified',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      pulse: false,
    },
    REJECTED: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400/40 animate-pulse',
      icon: XCircle,
      pulse: true,
    },
  };

  const current = config[normalizedStatus] || {
    label: normalizedStatus || 'Unknown',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    pulse: false,
  };

  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${current.color}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      title={`Sample Status: ${current.label}`}
    >
      <IconComponent size={iconSizes[size] || 14} className="flex-shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};
