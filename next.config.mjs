/** @type {import('next').NextConfig} */
const nextConfig = {
  // use this instead of experimental.serverComponentsExternalPackages
  serverExternalPackages: ["html-pdf-node", "mammoth"],

  // add other top-level settings if you have them (like images, reactStrictMode, etc.)
  reactStrictMode: true,
};

module.exports = nextConfig;
