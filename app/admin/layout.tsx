import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") || "";
  const isLogin = pathname === "/admin/login";

  const profile = isLogin ? null : await getCurrentProfile();

  if (!isLogin && (!profile || !profile.roles.includes("admin"))) {
    redirect("/admin/login");
  }

  if (isLogin || !profile) return <>{children}</>;

  return (
    <AdminShell pathname={pathname}>
      {children}
    </AdminShell>
  );
}
