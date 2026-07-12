import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

function getInitial(name?: string | null, email?: string | null): string {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

const sizeMap: Record<number, string> = {
  7: "size-7 text-[11px]",
  8: "size-8 text-sm",
  10: "size-10 text-sm",
  12: "size-12 text-lg",
};

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 8,
  className,
}: UserAvatarProps) {
  const sizeClass = sizeMap[size] ?? sizeMap[8];
  const initial = getInitial(name, email);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? email ?? "User"}
        className={cn(
          "shrink-0 rounded-full object-cover bg-[#F4F4F5]",
          sizeClass,
          className,
        )}
        style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] font-medium text-white",
        sizeClass,
        className,
      )}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {initial}
    </div>
  );
}
