import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

// Self-contained (inline styles) so it still looks right when the site's CSS can't be fetched.
export default function OfflinePage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif", background: "#0E1433", color: "#F2F4FA" }}>
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>You’re offline</h1>
        <p style={{ margin: "0 0 24px", lineHeight: 1.5, color: "#B7BED8" }}>
          Notera needs a connection to browse and preview files. Anything you already downloaded is still on your device.
        </p>
        <a href="/" style={{ display: "inline-block", padding: "12px 20px", borderRadius: 8, background: "#4A63F0", color: "#fff", textDecoration: "none", fontWeight: 600 }}>Try again</a>
      </div>
    </main>
  );
}
