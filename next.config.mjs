/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["html-pdf-node", "mammoth"],
  // DO NOT add `output: "export"` or any static export settings
};

module.exports = nextConfig;
