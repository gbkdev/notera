"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookMarked, Building2, CalendarRange, FileJson, FileStack, Flag, Inbox, LayoutDashboard, LogOut, UploadCloud } from "lucide-react";
import { signOutAdmin } from "@/app/actions/auth";
import { Logo } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/resources", label: "Resources", icon: FileStack },
  { href: "/admin/submissions", label: "Submissions", icon: UploadCloud },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/courses", label: "Courses", icon: BookMarked },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/terms", label: "Years & semesters", icon: CalendarRange },
  { href: "/admin/import", label: "Import JSON", icon: FileJson },
];

type Counts = { reports: number; submissions: number; requests: number };

export function AdminShell({ name, counts, children }: { name: string; counts: Counts; children: React.ReactNode }) {
  const badgeFor = (href: string) => (href === "/admin/reports" ? counts.reports : href === "/admin/submissions" ? counts.submissions : href === "/admin/requests" ? counts.requests : 0);
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b bg-card md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block md:space-y-6 md:p-5">
          <Logo />
          <nav aria-label="Admin" className="hidden space-y-1 md:block">
            {NAV.map((n) => <NavLink key={n.href} n={n} pathname={pathname} badge={badgeFor(n.href)} />)}
          </nav>
          <div className="flex items-center gap-1 md:hidden"><ThemeToggle /></div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
          {NAV.map((n) => <NavLink key={n.href} n={n} pathname={pathname} compact badge={badgeFor(n.href)} />)}
        </nav>
        <div className="hidden border-t p-4 md:absolute md:bottom-0 md:block md:w-full">
          <p className="mb-2 truncate text-sm text-muted-foreground">Signed in as {name}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={async () => { await signOutAdmin(); router.replace("/admin/login"); router.refresh(); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <span className="truncate text-sm text-muted-foreground">{name}</span>
          <Button variant="outline" size="sm" onClick={async () => { await signOutAdmin(); router.replace("/admin/login"); router.refresh(); }}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        <main className="mx-auto max-w-5xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ n, pathname, compact, badge = 0 }: { n: (typeof NAV)[number]; pathname: string; compact?: boolean; badge?: number }) {
  const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
  return (
    <Link href={n.href} aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-muted", active && "bg-muted text-primary", compact && "shrink-0")}>
      <n.icon className="h-4 w-4" aria-hidden /> {n.label}
      {badge > 0 && <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold text-white" aria-label={`${badge} open`}>{badge}</span>}
    </Link>
  );
}
