/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["html-pdf-node", "mammoth"],
};

module.exports = nextConfig;
