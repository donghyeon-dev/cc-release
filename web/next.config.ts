import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.resolve(__dirname);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
