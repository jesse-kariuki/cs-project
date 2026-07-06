'use client';

import { useState, useCallback } from 'react';
import { ZodSchema } from 'zod';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validationSchema?: ZodSchema;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validationSchema,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        if (validationSchema) {
          const result = validationSchema.safeParse(values);
          if (!result.success) {
            const fieldErrors: any = {};
            result.error.issues.forEach(error => {
              const path = error.path[0] as string;
              fieldErrors[path] = error.message;
            });
            setErrors(fieldErrors);
            setIsSubmitting(false);
            return;
          }
        }

        setErrors({});
        await onSubmit(values);
      } catch (error: any) {
        setSubmitError(error.message || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationSchema, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    reset,
    setValues,
  };
}