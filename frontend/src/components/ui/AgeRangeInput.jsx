import React, { useState, useEffect } from 'react';

/**
 * AgeRangeInput — Allows entering patient age limit with selectable units
 * (Years, Months, Days) and converts transparently to/from age in days for the API.
 *
 * @param {string} label Label above the input
 * @param {number|null} valueDays Age in days passed from parent state
 * @param {function} onChangeDays Callback returning age in days (or null if empty)
 * @param {string} placeholder Input placeholder
 * @param {boolean} disabled Whether inputs are disabled
 */
export const AgeRangeInput = ({
  label,
  valueDays,
  onChangeDays,
  placeholder = 'No limit',
  disabled = false,
}) => {
  // Determine best unit and value from days
  const parseDays = (days) => {
    if (days === null || days === undefined || days === '') {
      return { num: '', unit: 'YEARS' };
    }
    const d = Number(days);
    if (d % 365 === 0 && d > 0) {
      return { num: d / 365, unit: 'YEARS' };
    }
    if (d % 30 === 0 && d > 0) {
      return { num: d / 30, unit: 'MONTHS' };
    }
    return { num: d, unit: 'DAYS' };
  };

  const initial = parseDays(valueDays);
  const [numValue, setNumValue] = useState(initial.num);
  const [unit, setUnit] = useState(initial.unit);

  useEffect(() => {
    const updated = parseDays(valueDays);
    setNumValue(updated.num);
    setUnit(updated.unit);
  }, [valueDays]);

  const emitChange = (newNum, newUnit) => {
    if (newNum === '' || newNum === null || isNaN(Number(newNum))) {
      onChangeDays(null);
      return;
    }
    const val = Number(newNum);
    let days = val;
    if (newUnit === 'YEARS') {
      days = Math.round(val * 365);
    } else if (newUnit === 'MONTHS') {
      days = Math.round(val * 30);
    }
    onChangeDays(days);
  };

  const handleNumChange = (e) => {
    const val = e.target.value;
    setNumValue(val);
    emitChange(val, unit);
  };

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    emitChange(numValue, newUnit);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold text-gray-700">{label}</label>}
      <div className="flex rounded-lg border border-gray-300 shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white overflow-hidden">
        <input
          type="number"
          min="0"
          value={numValue}
          onChange={handleNumChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-2.5 py-1.5 text-xs text-gray-900 border-none outline-none disabled:bg-gray-50"
        />
        <select
          value={unit}
          onChange={handleUnitChange}
          disabled={disabled}
          className="px-2 py-1.5 text-xs bg-gray-50 text-gray-700 border-l border-gray-200 outline-none cursor-pointer hover:bg-gray-100"
        >
          <option value="YEARS">Yrs</option>
          <option value="MONTHS">Mo</option>
          <option value="DAYS">Days</option>
        </select>
      </div>
    </div>
  );
};

export default AgeRangeInput;
