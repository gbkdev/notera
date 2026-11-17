/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Admin uploads go through a server action; allow up to the 50 MB file limit plus form overhead.
    serverActions: { bodySizeLimit: "55mb" },
  },
};
export default nextConfig;
