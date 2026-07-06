'use client';

import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button content/label
   */
  children: ReactNode;

  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether button is in loading state (shows spinner, disables interaction)
   */
  isLoading?: boolean;

  /**
   * Loading indicator text (appears in place of children when isLoading=true)
   */
  loadingText?: string;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Icon to display left of text
   */
  leftIcon?: ReactNode;

  /**
   * Icon to display right of text
   */
  rightIcon?: ReactNode;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Reusable Button Component
 *
 * A flexible button component with multiple variants, sizes, and states.
 * Supports loading states, icons, and disabled states.
 *
 * @example
 * // Basic button
 * <Button>Click me</Button>
 *
 * @example
 * // Primary button with loading state
 * <Button variant="primary" isLoading={isLoading} loadingText="Submitting...">
 *   Submit
 * </Button>
 *
 * @example
 * // Danger button with left icon
 * <Button variant="danger" leftIcon={<TrashIcon />}>
 *   Delete
 * </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  // Base styles applied to all buttons
  const baseStyles =
    'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2';

  // Variant styles
  const variantStyles: Record<string, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 focus:ring-blue-500',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 focus:ring-gray-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 focus:ring-red-500',
    success:
      'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 focus:ring-green-500',
    ghost:
      'text-gray-700 hover:bg-gray-100 disabled:text-gray-400 focus:ring-gray-500',
  };

  // Size styles
  const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Combine all styles
  const computedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    (disabled || isLoading) && 'opacity-75 cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={computedClassName}
      {...props}
    >
      {/* Left Icon */}
      {leftIcon && !isLoading && <span className="flex-shrink-0">{leftIcon}</span>}

      {/* Button Text */}
      <span>
        {isLoading && loadingText ? loadingText : children}
      </span>

      {/* Right Icon */}
      {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}

      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </button>
  );
}