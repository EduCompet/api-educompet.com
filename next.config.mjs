// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   serverExternalPackages: ["html-pdf-node", "mammoth"],
//   // DO NOT add `output: "export"` or any static export settings
// };

// module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the 'standalone' output mode. 
  // This minimizes the required files for deployment and 
  // forces a production server build that is ideal for server/API-only deployments.
  output: 'standalone',

  // This prevents Next.js from aggressively trying to statically export pages 
  // during the build step, which is what is causing the /404 error.
  experimental: {
    // This flag is often necessary in API-only apps to prevent errors when 
    // the root 'app/page.js' is missing or simplified.
    missingSuspenseWithCSRBailout: false,
    
    // Explicitly define external packages to prevent them from being bundled, 
    // which can also help with build errors related to native modules (like 'sharp' or 'puppeteer').
    serverComponentsExternalPackages: ['mongoose', 'mongodb', 'firebase-admin', 'puppeteer', 'sharp'],
  },
};

module.exports = nextConfig;