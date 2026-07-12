import type { ReactNode } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AuthRootLayout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
