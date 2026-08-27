import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/app-session";
import { getCurrentProfile } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") || "";
  const isLogin = pathname === "/admin/login";

  const appSession = isLogin ? null : await getAppSession();
  const hasSignedAdminRole = appSession?.roles?.includes("admin") ?? false;
  const profile = isLogin || hasSignedAdminRole ? null : await getCurrentProfile();

  if (!isLogin && !hasSignedAdminRole && (!profile || !profile.roles.includes("admin"))) {
    redirect("/admin/login");
  }

  if (isLogin) return <>{children}</>;

  return (
    <AdminShell pathname={pathname}>
      {children}
    </AdminShell>
  );
}
