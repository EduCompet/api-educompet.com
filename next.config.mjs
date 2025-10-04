// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["html-pdf-node", "mammoth"],
  // do NOT use 'output: "export"'
};

module.exports = nextConfig;
