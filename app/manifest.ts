import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notera",
    short_name: "Notera",
    description: "Find, preview and download course notes, assignments, exams and slides. No account needed.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0E1433",
    theme_color: "#0E1433",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
