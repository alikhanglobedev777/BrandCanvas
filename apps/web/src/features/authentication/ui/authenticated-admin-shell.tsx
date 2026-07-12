"use client";

import {
  getAuthMeQueryKey,
  useAuthLogout,
  useAuthMe,
} from "@brandcanvas/contracts";
import { DashboardShell, LoadingState } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getDashboardNavigation } from "@/shared/config/dashboard-navigation";

export function AuthenticatedAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const account = useAuthMe({ query: { retry: false } });
  const logout = useAuthLogout({
    mutation: {
      onSettled: () => {
        queryClient.removeQueries({ queryKey: getAuthMeQueryKey() });
        router.replace("/admin/login");
      },
    },
  });

  useEffect(() => {
    if (account.isError) router.replace("/admin/login");
  }, [account.isError, router]);

  if (account.isPending || account.isError || !account.data) {
    return <LoadingState label={account.isError ? "Redirecting to sign in…" : "Loading your workspace…"} />;
  }

  const navigation = getDashboardNavigation(account.data.platformRole).map((item) => ({
    ...item,
    selected: pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`)),
  }));

  return (
    <DashboardShell
      navigation={navigation}
      accountLabel={`${account.data.name} · ${account.data.platformRole === "super_admin" ? "Super admin" : "Seller"}`}
      onSignOut={() => logout.mutate()}
    >
      {account.data.mustChangePassword ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This account is using a temporary password. Change-password enforcement will be completed in the account-settings feature.
        </Alert>
      ) : null}
      {children}
    </DashboardShell>
  );
}
