'use client';

import React, { ReactNode, useState } from 'react';

interface AlertProps {
  /**
   * Alert content/message
   */
  message: ReactNode;

  /**
   * Alert type/variant
   * @default 'info'
   */
  type?: 'success' | 'error' | 'warning' | 'info';

  /**
   * Title displayed above message (optional)
   */
  title?: string;

  /**
   * Whether alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Icon to display (replaces default icon if provided)
   */
  icon?: ReactNode;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Auto-dismiss after specified milliseconds (0 = no auto-dismiss)
   * @default 0
   */
  autoDismiss?: number;

  /**
   * Additional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Alert Component
 *
 * A flexible alert/notification component for displaying messages to users.
 * Supports multiple variants (success, error, warning, info), dismissible alerts,
 * auto-dismiss functionality, and optional action buttons.
 *
 * @example
 * // Success alert
 * <Alert type="success" message="Operation completed successfully!" />
 *
 * @example
 * // Dismissible error alert
 * <Alert
 *   type="error"
 *   title="Error"
 *   message="Failed to save changes"
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 *
 * @example
 * // Auto-dismissing warning
 * <Alert
 *   type="warning"
 *   message="This is a temporary notification"
 *   autoDismiss={3000}
 * />
 */
export default function Alert({
  message,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  autoDismiss = 0,
  action,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss effect
  React.useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Background and border colors by type
  const colorStyles: Record<string, { bg: string; border: string; icon: ReactNode }> = {
    success: {
      bg: 'bg-green-50 border-green-200',
      border: 'border-green-200',
      icon: (
        <svg
          className="w-5 h-5 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      border: 'border-red-200',
      icon: (
        <svg
          className="w-5 h-5 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      border: 'border-yellow-200',
      icon: (
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      border: 'border-blue-200',
      icon: (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  // Text color by type
  const textColorStyles: Record<string, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  // Button color by type
  const buttonColorStyles: Record<string, string> = {
    success: 'text-green-600 hover:text-green-700',
    error: 'text-red-600 hover:text-red-700',
    warning: 'text-yellow-600 hover:text-yellow-700',
    info: 'text-blue-600 hover:text-blue-700',
  };

  const colors = colorStyles[type];
  const textColor = textColorStyles[type];
  const buttonColor = buttonColorStyles[type];

  return (
    <div
      className={[
        'border rounded-lg p-4 flex gap-3',
        colors.bg,
        colors.border,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0 flex items-start justify-center mt-0.5">
        {icon || colors.icon}
      </div>

      {/* Content */}
      <div className="flex-grow">
        {/* Title */}
        {title && (
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {title}
          </h3>
        )}

        {/* Message */}
        <div className={`text-sm ${textColor}`}>
          {message}
        </div>

        {/* Action button */}
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-2 text-sm font-medium underline hover:no-underline ${buttonColor} transition-colors`}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${buttonColor} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded`}
          aria-label="Close alert"
          type="button"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}