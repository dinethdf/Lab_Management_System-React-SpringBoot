import React from 'react';

/**
 * Button — Reusable action button component.
 *
 * Upgraded with:
 * - loading state (displays spinner and prevents double-clicking)
 * - leftIcon support (renders Lucide or custom icon left of label)
 * - size variants ('sm', 'md', 'lg')
 *
 * Props:
 *   children  (ReactNode) — Button text or inner elements
 *   variant   ('primary'|'secondary'|'danger'|'ghost') — Visual theme
 *   size      ('sm'|'md'|'lg') — Padding and font size
 *   loading   (boolean)   — Disables button and displays inline spinner
 *   leftIcon  (ReactNode) — Icon placed to the left of the button text
 *   disabled  (boolean)   — Disables button
 *   className (string)    — Additional Tailwind classes
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-xs';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400 shadow-none',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-base min-h-[48px]',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        ${baseStyle}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
