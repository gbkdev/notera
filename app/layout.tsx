import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SITE_URL } from "@/lib/site";
import { RegisterSW } from "@/components/register-sw";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "Notera", type: "website" },
  title: { default: "Notera — Your Learning Resources, All in One Place", template: "%s · Notera" },
  description: "Find, preview and download lecture notes, assignments, exams and slides for your courses. No account needed.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF1F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
          <RegisterSW />
        </ThemeProvider>
      </body>
    </html>
  );
}
