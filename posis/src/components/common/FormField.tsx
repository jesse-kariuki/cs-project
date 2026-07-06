'use client';

import React, { InputHTMLAttributes, useState } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Field label displayed above the input
   */
  label?: string;

  /**
   * Field name (used for id and accessibility)
   */
  name: string;

  /**
   * Validation error message to display below input
   */
  error?: string;

  /**
   * Helper text displayed below label (when no error)
   */
  helperText?: string;

  /**
   * Input type
   * @default 'text'
   */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'date' | 'time';

  /**
   * Whether field is required
   */
  required?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Icon to display inside input (left side)
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display inside input (right side)
   */
  rightIcon?: React.ReactNode;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Current input value
   */
  value?: string | number;

  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Blur handler
   */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Field variant (outline, filled, etc.)
   * @default 'outline'
   */
  variant?: 'outline' | 'filled';
}

/**
 * FormField Component
 *
 * A reusable form input component that wraps standard HTML input with:
 * - Label and helper text
 * - Error message display
 * - Icon support (left and right)
 * - Size and variant options
 * - Accessibility features (aria-labels, aria-invalid, aria-describedby)
 *
 * @example
 * // Basic text input with error
 * <FormField
 *   label="Username"
 *   name="username"
 *   value={username}
 *   onChange={handleChange}
 *   error={errors.username}
 * />
 *
 * @example
 * // Password field with helper text
 * <FormField
 *   label="Password"
 *   name="password"
 *   type="password"
 *   value={password}
 *   onChange={handleChange}
 *   helperText="Must be at least 8 characters"
 * />
 *
 * @example
 * // Email field with left icon
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={handleChange}
 *   leftIcon={<MailIcon />}
 * />
 */
export default function FormField({
  label,
  name,
  error,
  helperText,
  type = 'text',
  required = false,
  placeholder,
  leftIcon,
  rightIcon,
  disabled = false,
  value,
  onChange,
  onBlur,
  size = 'md',
  variant = 'outline',
  className = '',
  ...props
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID for accessibility
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const helperId = `helper-${name}`;

  // Base input styles
  const baseInputStyles =
    'w-full font-medium transition-colors duration-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-75';

  // Variant styles
  const variantStyles: Record<string, string> = {
    outline: `border-2 border-gray-300 rounded-lg ${
      error ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : 'focus:border-blue-500 focus:ring-blue-100'
    } focus:ring-4`,
    filled: `bg-gray-100 border-0 border-b-2 border-gray-300 rounded-t-lg ${
      error ? 'border-b-red-500 focus:border-b-red-600' : 'focus:border-b-blue-500'
    }`,
  };

  // Size styles
  const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  // Label styles
  const labelStyles = 'block text-sm font-medium text-gray-700 mb-2';

  // Error text styles
  const errorStyles = 'text-red-600 text-sm mt-1 font-medium';

  // Helper text styles
  const helperStyles = 'text-gray-500 text-sm mt-1';

  // Container styles
  const containerStyles = 'w-full flex flex-col';

  const inputClassName = [
    baseInputStyles,
    variantStyles[variant],
    sizeStyles[size],
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={containerStyles}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {/* Input container with icons */}
      <div className="relative flex items-center">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-gray-500 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-gray-500 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className={errorStyles}>
          {error}
        </p>
      )}

      {/* Helper text (only show if no error) */}
      {helperText && !error && (
        <p id={helperId} className={helperStyles}>
          {helperText}
        </p>
      )}
    </div>
  );
}