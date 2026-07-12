import type { ReactNode } from "react";
import { AuthenticatedAdminShell } from "@/features/authentication";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedAdminShell>{children}</AuthenticatedAdminShell>;
}
