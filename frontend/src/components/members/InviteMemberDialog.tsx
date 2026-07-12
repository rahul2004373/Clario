"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemberStore } from "@/store/memberStore";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["ADMIN", "VIEWER"]),
});

type InviteInput = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteMemberDialog({
  open,
  onClose,
  workspaceId,
}: InviteMemberDialogProps) {
  const inviteMember = useMemberStore((s) => s.inviteMember);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "VIEWER" },
  });

  const selectedRole = watch("role");

  if (!open) return null;

  const onSubmit = async (data: InviteInput) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await inviteMember(workspaceId, { email: data.email, role: data.role });
      setSuccess(true);
      reset();
      setTimeout(onClose, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite member.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} />
      <div className="relative z-10 w-full max-w-[420px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
            Invite member
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex size-7 items-center justify-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="invite-email"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A1A1AA]" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                disabled={submitting}
                className={`pl-9 ${errors.email ? "border-[#EF4444]" : ""}`}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[12px] text-[#EF4444]" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#0A0A0A]">
              Role
            </label>
            <div className="flex gap-2">
              {(["ADMIN", "VIEWER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={submitting}
                  onClick={() => setValue("role", r, { shouldValidate: false })}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedRole === r
                      ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                      : "border-[#D4D4D8] bg-white text-[#71717A] hover:border-[#A1A1AA] hover:text-[#0A0A0A]"
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#EF4444]">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-600/20 bg-[#F0FDF4] px-3 py-2.5 text-[13px] text-green-600">
              Member invited successfully.
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full text-[15px] font-medium disabled:bg-[#D4D4D8] disabled:text-[#71717A]"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Send invite"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
