const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Azure App Service (Linux) hosts this as a full Node.js server. The deployment
  // sets NEXT_OUTPUT_MODE=standalone so `next build` emits `.next/standalone/server.js`
  // (started with `node server.js`). Server-side API routes and SSR are preserved —
  // this is intentionally NOT a static export, so deep links resolve on refresh.
  output: process.env.NEXT_OUTPUT_MODE,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Run instrumentation.ts once at server startup for environment validation.
    instrumentationHook: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Image optimisation review (parity migration):
  // - All app images are LOCAL static assets (e.g. /logo.png, /kkm-hkl-logo.jpeg) or
  //   runtime data: URLs from user uploads. Next.js cannot optimise data: URLs, and
  //   there are NO remote image domains.
  // - The Phoenix AI logo has a hard branding requirement to render at exact
  //   proportions/fidelity, and committed visual baselines assert pixel parity.
  // - The built-in optimiser would transcode/re-encode (e.g. to WebP), which risks
  //   altering those images. Optimisation is therefore left OFF until it can be proven
  //   not to change or break the existing images. Static assets are still served with
  //   long-lived immutable caching by App Service / Next.
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.filename = 'static/chunks/[name]-[contenthash:8].js';
      config.output.chunkFilename = 'static/chunks/[contenthash:16].js';
    }
    return config;
  },
};

module.exports = nextConfig;
