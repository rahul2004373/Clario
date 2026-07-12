"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import type { ZodSchema } from "zod";
import { NotImplementedError, ApiError } from "@/lib/auth/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const rhfResolver = <TFieldValues extends FieldValues>(schema: ZodSchema): Resolver<TFieldValues> => {
  return (async (values: TFieldValues) => {
    const result = (schema as any).safeParse(values);
    if (result.success) {
      return { values: result.data as TFieldValues, errors: {} as any };
    }
    const fieldErrors: Record<string, { message: string }> = {};
    for (const issue of result.error.issues ?? []) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = { message: issue.message };
      }
    }
    return { values: values as TFieldValues, errors: fieldErrors as any };
  }) as Resolver<TFieldValues>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ServerError {
  message: string;
  isNetworkError: boolean;
}

export interface UseAuthFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  showSpinner: boolean;
  serverError: ServerError | null;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  dismissError: () => void;
}

interface UseAuthFormOptions<T extends FieldValues> {
  schema: ZodSchema;
  defaultValues: DefaultValues<T>;
  mutationFn: (data: T) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
}

export function useAuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  mutationFn,
  onSuccess,
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const form = useForm<T>({
    resolver: rhfResolver<T>(schema) as Resolver<T>,
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    };
  }, []);

  const dismissError = useCallback(() => {
    setServerError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) e.preventDefault();
      if (isSubmitting) return;

      setServerError(null);

      const isValid = await form.trigger();
      if (!isValid) return;

      setIsSubmitting(true);
      spinnerTimer.current = setTimeout(() => {
        if (mountedRef.current) setShowSpinner(true);
      }, 300);

      try {
        const data = form.getValues();
        const result = await mutationFn(data);
        if (mountedRef.current) {
          onSuccess?.(result);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        if (err instanceof ApiError) {
          setServerError({ message: err.message, isNetworkError: false });
        } else if (err instanceof NotImplementedError) {
          setServerError({
            message: `${err.fn} — wire this with the real API.`,
            isNetworkError: false,
          });
        } else if (
          err instanceof TypeError ||
          (err instanceof Error && err.message === "Failed to fetch")
        ) {
          setServerError({
            message: "Network error. Please check your connection and try again.",
            isNetworkError: true,
          });
        } else if (err instanceof Error) {
          setServerError({
            message: err.message,
            isNetworkError: false,
          });
        } else {
          setServerError({
            message: "Something went wrong. Please try again.",
            isNetworkError: true,
          });
        }
      } finally {
        if (mountedRef.current) {
          setIsSubmitting(false);
          setShowSpinner(false);
        }
      }
    },
    [form, isSubmitting, mutationFn, onSuccess],
  );

  return {
    form,
    isSubmitting,
    showSpinner,
    serverError,
    handleSubmit: handleSubmit as (e?: React.BaseSyntheticEvent) => Promise<void>,
    dismissError,
  };
}
