import React from 'react';
import { Check } from 'lucide-react';

/**
 * StepWizard — Multi-step progress indicator for multi-stage forms (such as Add Test Wizard).
 *
 * Implements lab UX safety:
 * - Completed steps display a green checkmark and are clickable to go back.
 * - Current step is highlighted in active blue.
 * - Future unvisited steps cannot be clicked ahead to prevent incomplete steps.
 *
 * Props:
 *   steps          (Array)    — Step objects: [{ title, description }]
 *   currentStep    (number)   — Zero-based active step index
 *   completedSteps (number[]) — Array of completed step indices (e.g. [0, 1])
 *   onStepClick    (function) — Handler to navigate back to a completed step
 *   className      (string)   — Extra classes for container
 */
export const StepWizard = ({
  steps = [],
  currentStep = 0,
  completedSteps = [],
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isClickable = isCompleted && onStepClick;

          return (
            <React.Fragment key={index}>
              {/* Step indicator node */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-200 border-2
                    ${isCompleted
                      ? 'bg-green-600 border-green-600 text-white cursor-pointer hover:bg-green-700'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  aria-label={`Step ${index + 1}: ${step.title || step.label || ''}`}
                >
                  {isCompleted ? <Check size={18} /> : index + 1}
                </button>

                {/* Step labels */}
                <div className="mt-2 text-center">
                  <span
                    className={`
                      block text-xs font-semibold
                      ${isCurrent
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-gray-800'
                        : 'text-gray-400'
                      }
                    `}
                  >
                    {step.title || step.label}
                  </span>
                  {step.description && (
                    <span className="hidden sm:block text-[11px] text-gray-400 mt-0.5">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 -mt-6 mx-2 transition-colors duration-200
                    ${isCompleted || (isCurrent && completedSteps.includes(index))
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
