import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Logo } from "@/components/site-header";
import { InstallButton } from "@/components/install-button";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Free course materials for university students. Browse, preview and download without an account.
          </p>
          <InstallButton />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Browse</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/departments">Departments</Link></li>
            <li><Link className="hover:text-foreground" href="/resources">All resources</Link></li>
            <li><Link className="hover:text-foreground" href="/contribute">Request or share a file</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Categories</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c.value}><Link className="hover:text-foreground" href={`/resources?category=${c.value}`}>{c.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Notera</span>
          <span>Powered by gbkdev</span>
        </div>
      </div>
    </footer>
  );
}
