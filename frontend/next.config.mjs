import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Allow the service worker to control the whole scope.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

// withSentryConfig is a no-op at runtime without a DSN; suppresses build noise.
export default withSentryConfig(nextConfig, {
  silent: true,
  // Set these (+ SENTRY_AUTH_TOKEN) later to upload source maps in CI:
  // org: "your-org",
  // project: "hmb-frontend",
});
