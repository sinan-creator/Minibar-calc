import type { NextConfig } from "next";

// Sub-folder hosting (e.g. GitHub Pages at /Minibar-calc). Empty for the root of a domain.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Fully static: no backend, served from any static host or opened offline via the service worker.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  // Static export has no image optimizer; the logo is served as-is.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
