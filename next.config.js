/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tells Next.js to treat the build as a purely server-side application
  // which will prevent it from trying to statically optimize or pre-render pages.
  output: 'standalone',
  
  // This is a new, crucial configuration for an API-only app using the App Router.
  // It ensures the root 'app/page.js' isn't required and effectively disables the default UI.
  // Note: This option is available in Next.js 14 and later.
  experimental: {
    // This is the key setting that stops it from expecting a root page.
    missingSuspenseWithCSRBailout: false,
    appDir: true, // You are using the App Router API structure
    outputFileTracing: true, // Recommended for `standalone`
    serverComponentsExternalPackages: ['mongoose', 'mongodb', 'firebase-admin', 'puppeteer'], // Add any heavy npm packages here to keep the final bundle small
  },
  
  // Disable static export entirely, which forces pages to be rendered at request time,
  // preventing the static prerendering build step that is failing.
  // NOTE: If you are using `output: 'standalone'`, this is often not needed, but can be a good fallback.
  // Note: Only necessary if you were using `next export` previously, which often isn't the case for API-only builds.
  // output: 'server', // This is the default in Next.js 14, but 'standalone' is better for deployment
};

module.exports = nextConfig;