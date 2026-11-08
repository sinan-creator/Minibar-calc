import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: no backend, served from any static host or opened offline via the service worker.
  output: "export",
  reactStrictMode: true,
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
