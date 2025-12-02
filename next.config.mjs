import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/referral-intake/:path*',
        destination: '/admin/referral-intake/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://*.clerk.accounts.dev https://convex.cloud https://*.convex.cloud https://meet.jit.si",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://convex.cloud https://*.convex.cloud wss://*.convex.cloud https://*.sendbird.com wss://*.sendbird.com https://meet.jit.si wss://meet.jit.si https://api.mapbox.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://meet.jit.si",
              "media-src 'self' blob: https://meet.jit.si",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self "https://*.daily.co"), microphone=(self "https://*.daily.co"), display-capture=(self "https://*.daily.co")',
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

export default nextConfig;