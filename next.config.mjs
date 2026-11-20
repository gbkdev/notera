/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 16 buffers request bodies in the proxy (which guards /admin) and keeps only the first 10 MB by default.
    // Without this, any admin upload over 10 MB arrives truncated and fails with "Unexpected end of form".
    proxyClientMaxBodySize: "55mb",
    // Admin uploads go through a server action; allow up to the 50 MB file limit plus form overhead.
    serverActions: { bodySizeLimit: "55mb" },
  },
};
export default nextConfig;
