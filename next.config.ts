import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Explicitly include shopify-clone HTML files in the serverless bundle
  outputFileTracingIncludes: {
    "/**": ["./shopify-clone/**/*.html"]
  }
};

export default nextConfig;
