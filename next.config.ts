import type { NextConfig } from "next";

/**
 * GitHub Pages serves project sites from /<repo>/, so the static build is prefixed with the
 * repository name when running inside GitHub Actions. Local dev stays at the root.
 */
const basePath = process.env.GITHUB_ACTIONS ? "/bonum" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
