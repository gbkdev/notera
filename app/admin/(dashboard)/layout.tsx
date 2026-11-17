import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = await requireAdmin(); // server-side permission check on every admin page
  return <AdminShell name={name}>{children}</AdminShell>;
}
