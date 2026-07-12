"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useUserStore } from "@/store/userStore";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  avatarUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function AccountSettingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" },
  });

  const currentAvatarUrl = watch("avatarUrl");

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const onSubmit = async (data: ProfileInput) => {
    if (submitting || !isDirty) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({ name: data.name, avatarUrl: data.avatarUrl || undefined });
      setSuccess(true);
      reset({ name: data.name, avatarUrl: data.avatarUrl ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-[420px]">
        <Link
          href={`/workspace/${localStorage.getItem("currentWorkspaceId") ?? ""}/agents`}
          className="mb-8 flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-[#0A0A0A] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>

        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A]">
            Account settings
          </h1>
          <p className="text-[14px] text-[#71717A]">
            Manage your personal profile.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-[#D4D4D8] p-4">
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarUrl={currentAvatarUrl || user.avatarUrl}
            size={12}
          />
          <div>
            <p className="text-sm font-medium text-[#0A0A0A]">{user.name}</p>
            <p className="text-xs text-[#71717A]">{user.email}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Display name
            </label>
            <Input
              id="profile-name"
              disabled={submitting}
              className={errors.name ? "border-[#EF4444]" : ""}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[12px] text-[#EF4444]" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Email
            </label>
            <Input
              id="profile-email"
              value={user.email}
              disabled
              className="bg-[#F4F4F5] text-[#71717A]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-avatar"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Avatar URL
            </label>
            <Input
              id="profile-avatar"
              placeholder="https://example.com/avatar.jpg"
              disabled={submitting}
              className={errors.avatarUrl ? "border-[#EF4444]" : ""}
              aria-invalid={!!errors.avatarUrl}
              {...register("avatarUrl")}
            />
            {errors.avatarUrl && (
              <p className="text-[12px] text-[#EF4444]" role="alert">
                {errors.avatarUrl.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-[12px] text-[#EF4444]" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || !isDirty}
            size="lg"
            className="w-full text-[15px] font-medium disabled:bg-[#D4D4D8] disabled:text-[#71717A]"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
