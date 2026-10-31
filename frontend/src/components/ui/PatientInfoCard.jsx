import React from 'react';
import { User, Phone, Calendar, ShieldAlert } from 'lucide-react';

/**
 * PatientInfoCard — Compact patient context banner pinned at the top of workflow pages.
 *
 * Implements strict lab UX rules:
 * - Age and gender are prominently displayed (vital for reference range interpretation).
 * - Under-18 patients feature an unmistakable yellow MINOR badge with guardian information.
 * - Distinct blue-tinted card background establishes clear visual separation from general forms.
 *
 * Props:
 *   id            (string)        — Patient ID (e.g. 'P-0045')
 *   name          (string)        — Patient full name
 *   dob           (string)        — Date of birth (formatted or ISO)
 *   gender        (string)        — Gender ('Male' | 'Female')
 *   contactNumber (string)        — Mobile / phone contact
 *   age           (number|string) — Computed age in years
 *   isMinor       (boolean)       — Shows guardian alert badge when true
 *   guardianName  (string)        — Guardian name for minor patients
 *   className     (string)        — Extra styling overrides
 */
export const PatientInfoCard = ({
  id,
  name,
  dob,
  gender,
  contactNumber,
  age,
  isMinor = false,
  guardianName,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5
        flex flex-col md:flex-row md:items-center justify-between gap-4
        shadow-xs mb-6
        ${className}
      `}
    >
      {/* Patient Identity & Primary Demographics */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
          <User size={22} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              {name || 'Unknown Patient'}
            </h3>
            {id && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700">
                {id}
              </span>
            )}
            {isMinor && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldAlert size={12} />
                MINOR
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
            {age !== undefined && (
              <span>
                <strong>Age:</strong> {age} yrs
              </span>
            )}
            {gender && (
              <>
                <span>•</span>
                <span>
                  <strong>Gender:</strong> {gender}
                </span>
              </>
            )}
            {dob && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" />
                  {dob}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Contacts & Guardian Info */}
      <div className="flex flex-col sm:items-end justify-center text-xs text-gray-600 border-t md:border-t-0 pt-3 md:pt-0 border-blue-100 gap-1">
        {contactNumber && (
          <div className="inline-flex items-center gap-1.5 font-medium text-gray-700">
            <Phone size={13} className="text-blue-600" />
            <span>{contactNumber}</span>
          </div>
        )}

        {isMinor && guardianName && (
          <div className="text-amber-800 font-medium">
            Guardian: <span className="font-semibold">{guardianName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
