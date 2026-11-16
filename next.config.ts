import type { NextConfig } from "next";

// A fully static site: `pnpm build` writes out/, which any static host can serve (GitHub Pages,
// Cloudflare, Netlify, Vercel). There is no server, so the spreadsheets never leave the browser.
const nextConfig: NextConfig = {
  output: "export",
  // For GitHub Pages at https://<user>.github.io/<repo>/, set the repository name as basePath.
};

export default nextConfig;
