"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/departments", label: "Departments" },
  { href: "/resources", label: "All resources" },
  { href: "/saved", label: "Saved" },
  { href: "/contribute", label: "Contribute" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground" aria-hidden>
        <span className="flex gap-[3px]"><i className="block h-4 w-[3px] rounded-sm bg-fmt-pdf" /><i className="block h-4 w-[3px] rounded-sm bg-accent" /><i className="block h-4 w-[3px] rounded-sm bg-fmt-xls" /></span>
      </span>
      Notera
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { ids, ready } = useSaved();
  const count = (href: string) => (href === "/saved" && ready && ids.length > 0 ? ids.length : 0);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={cn("rounded-md px-3 py-2 text-sm font-medium hover:bg-muted", pathname.startsWith(n.href) && "bg-muted")}>
              {n.label}{count(n.href) > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{count(n.href)}</span>}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-expanded={open} aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t bg-background px-4 py-3 md:hidden">
          {[{ href: "/", label: "Home" }, ...NAV].map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-md px-3 py-3 text-base font-medium hover:bg-muted">
              {n.label}{count(n.href) > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{count(n.href)}</span>}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
