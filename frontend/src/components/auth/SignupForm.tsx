"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { FormDivider } from "@/components/auth/FormDivider";
import { signupSchema, type SignupInput } from "@/lib/auth/schemas";
import { signupWithEmail, getGoogleOAuthUrl, storeTokens } from "@/lib/auth/api";
import { getWorkspaces } from "@/lib/api/workspace";
import { UnauthorizedError } from "@/lib/api/client";
import { useUserStore } from "@/store/userStore";
import { useAuthForm } from "@/hooks/useAuthForm";

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function SignupForm() {
  const router = useRouter();
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { form, isSubmitting, showSpinner, serverError, handleSubmit, dismissError } =
    useAuthForm<SignupInput>({
      schema: signupSchema,
      defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
      mutationFn: (data) =>
        signupWithEmail({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      onSuccess: async (result) => {
        const authRes = result as { user: { id: string; email: string; name: string }; session: { access_token: string; refresh_token: string; expires_at: number } };
        storeTokens(authRes.session);
        useUserStore.getState().fetchCurrentUser();
        try {
          const { workspaces } = await getWorkspaces();
          if (workspaces.length === 0) {
            router.push("/workspace/create");
          } else {
            const lastUsedId = typeof window !== "undefined" ? localStorage.getItem("currentWorkspaceId") : null;
            const target = lastUsedId && workspaces.some((w) => w.id === lastUsedId) ? lastUsedId : workspaces[0].id;
            localStorage.setItem("currentWorkspaceId", target);
            router.push(`/workspace/${target}/agents`);
          }
        } catch (err) {
          if (err instanceof UnauthorizedError) {
            router.push("/login");
          } else {
            router.push("/");
          }
        }
      },
    });

  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const passwordValue = watch("password");
  const confirmValue = watch("confirmPassword");
  const showConfirmError = confirmValue && passwordValue !== confirmValue;

  const activeError = serverError?.message ?? googleError;
  const dismissActiveError = () => {
    dismissError();
    setGoogleError(null);
  };

  const handleGoogleLogin = useCallback(async () => {
    setGoogleError(null);
    setGoogleSubmitting(true);
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3000/auth/callback";
      const { url } = await getGoogleOAuthUrl(redirectUrl);
      window.location.href = url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong signing in with Google.";
      setGoogleError(message);
      setGoogleSubmitting(false);
    }
  }, []);

  const disableAll = isSubmitting || googleSubmitting;

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A]">Create an account</h1>
        <p className="text-[14px] text-[#71717A]">Get started with Clairo.</p>
      </div>

      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#EF4444]"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{activeError}</span>
            <button
              type="button"
              onClick={dismissActiveError}
              aria-label="Dismiss error"
              className="shrink-0 text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-[13px] font-medium text-[#0A0A0A]">
            Full name
          </label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            disabled={disableAll}
            className={errors.name ? "border-[#EF4444]" : ""}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="signup-name-error" className="text-[12px] text-[#EF4444]" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-[13px] font-medium text-[#0A0A0A]">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            disabled={disableAll}
            className={errors.email ? "border-[#EF4444]" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="signup-email-error" className="text-[12px] text-[#EF4444]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <PasswordInput
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          disabled={disableAll}
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          id="signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          disabled={disableAll}
          error={errors.confirmPassword?.message || (showConfirmError ? "Passwords do not match" : undefined)}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          disabled={disableAll}
          size="lg"
          className="w-full text-[15px] font-medium disabled:bg-[#D4D4D8] disabled:text-[#71717A] disabled:shadow-none disabled:hover:bg-[#D4D4D8]"
        >
          {showSpinner ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <FormDivider />

      <SocialAuthButton
        icon={GOOGLE_ICON}
        provider="Google"
        disabled={disableAll}
        onClick={handleGoogleLogin}
      />

      <p className="text-center text-[13px] text-[#71717A]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#0A0A0A] hover:text-[#52525B] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
