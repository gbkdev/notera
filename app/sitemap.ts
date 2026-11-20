import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createPublicClient();
  const [d, c, r] = await Promise.all([
    sb.from("departments").select("slug"),
    sb.from("courses").select("id"),
    sb.from("resources").select("id, updated_at"),
  ]);
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/departments` },
    { url: `${SITE_URL}/resources` },
    ...(d.data ?? []).map((x) => ({ url: `${SITE_URL}/departments/${x.slug}` })),
    ...(c.data ?? []).map((x) => ({ url: `${SITE_URL}/courses/${x.id}` })),
    ...(r.data ?? []).map((x) => ({ url: `${SITE_URL}/resources/${x.id}`, lastModified: x.updated_at })),
  ];
}
