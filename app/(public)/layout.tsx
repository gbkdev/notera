import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LiveRefresh } from "@/components/live-refresh";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <LiveRefresh tables={["resources", "departments", "courses"]} minGap={5000} />
      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
