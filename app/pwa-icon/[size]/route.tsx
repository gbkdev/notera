import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

// Full-bleed square so the same file works as a maskable icon.
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const n = size === "512" ? 512 : 192;
  return new ImageResponse(brandIcon(n), { width: n, height: n });
}
