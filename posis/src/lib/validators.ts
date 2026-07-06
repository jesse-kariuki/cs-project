import { z } from 'zod';

/**
 * Login Form Validation Schema
 * Validates:
 * - username: required, min 3 characters, alphanumeric with underscores
 * - password: required, min 6 characters
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password must not exceed 255 characters'),
});

/**
 * Login Form Data Type
 * Automatically inferred from loginSchema
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register Form Validation Schema
 * Validates:
 * - username: required, min 3 characters, alphanumeric with underscores
 * - password: required, min 8 characters, must contain uppercase, lowercase, number, special char
 * - confirmPassword: must match password field
 * - email: valid email format (optional)
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      ),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*]/,
        'Password must contain at least one special character (!@#$%^&*)'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Register Form Data Type
 * Automatically inferred from registerSchema
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Invoice Form Validation Schema
 * Validates invoice details before submission
 */
export const invoiceSchema = z.object({
  customerId: z
    .number()
    .int('Customer ID must be an integer')
    .min(1, 'Please select a customer'),
  laborAmount: z
    .number()
    .min(0, 'Labor amount cannot be negative')
    .max(1000000, 'Labor amount is too large'),
  paymentMethod: z
  .enum(['M-Pesa', 'Cash', 'Bank'])
  .default('Cash')
  .or(z.string())
  .pipe(z.enum(['M-Pesa', 'Cash', 'Bank'])),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

/**
 * Invoice Form Data Type
 */
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

/**
 * Spare Part Search Validation Schema
 */
export const partSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .trim(),
});

/**
 * Spare Part Search Data Type
 */
export type PartSearchData = z.infer<typeof partSearchSchema>;

/**
 * Add Part to Invoice Validation Schema
 */
export const addPartSchema = z.object({
  partId: z
    .number()
    .int('Part ID must be an integer')
    .min(1, 'Invalid part selected'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity is too large'),
});

/**
 * Add Part to Invoice Data Type
 */
export type AddPartData = z.infer<typeof addPartSchema>;

/**
 * Payment Validation Schema
 */
export const paymentSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount is too large'),
  paymentMethod: z
  .enum(['M-Pesa', 'Cash', 'Bank'])
  .default('Cash')
  .or(z.string())
  .pipe(z.enum(['M-Pesa', 'Cash', 'Bank'])),
  referenceNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Za-z0-9]{1,50}$/.test(val),
      'Reference number must contain only letters and numbers'
    ),
});

/**
 * Payment Data Type
 */
export type PaymentData = z.infer<typeof paymentSchema>;

/**
 * Change Password Validation Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Change Password Data Type
 */
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

/**
 * Utility function to extract error message from Zod error
 */
export function getZodErrorMessage(error: any): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || 'Validation failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Utility function to get field errors from Zod error
 */
export function getZodFieldErrors(
  error: unknown
): Record<string, string> {
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    error.issues.forEach((err) => {
      const path = err.path[0];
      if (typeof path === 'string') {
        fieldErrors[path] = err.message;
      }
    });
    return fieldErrors;
  }
  return {};
}