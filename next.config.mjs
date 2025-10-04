// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   serverExternalPackages: ["html-pdf-node", "mammoth"],
//   // DO NOT add `output: "export"` or any static export settings
// };

/** @type {import('next').NextConfig} */
const nextConfig = {
    // CRITICAL: Forces Next.js to build a minimal, self-contained server application.
    // This is the key setting to resolve the "<Html>" prerendering error
    // and is recommended for API-only backends on platforms like AWS Amplify.
    output: "standalone",

    // Configuration for Next.js features, specifically targeting your API-only project structure.
    experimental: {
        // Suppresses a runtime error when the root 'app/page.js' (frontend entry point)
        // is missing or minimal, which is likely in an API-only project.
        missingSuspenseWithCSRBailout: false,

        // RECOMMENDED: Explicitly list heavy or legacy server-side Node.js packages.
        // This tells Next.js's bundler (Webpack) to treat them as external packages
        // to be loaded at runtime, which prevents complex module logic (like handlebars'
        // 'require.extensions') from breaking the build process.
        serverComponentsExternalPackages: [
            "mongoose",
            "mongodb",
            "firebase-admin",
            "puppeteer",
            "sharp",
            "html-pdf-node", // Including your specific problematic module
        ],
    },

    // OPTIONAL: Advanced Webpack configuration to explicitly exclude problematic modules
    // and handle the 'require.extensions' warning, which may prevent future issues.
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Exclude these modules from the serverless bundle if they contain platform-specific
            // binaries or confusing Node.js logic like 'require.extensions'.
            config.externals = ["html-pdf-node", ...config.externals];
        }
        return config;
    },
};

module.exports = nextConfig;
