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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.daily.co https://*.convex.cloud https://*.clerk.accounts.dev wss://*.daily.co wss://*.convex.cloud",
              "frame-src 'self' https://*.daily.co",
              "media-src 'self' blob: https://*.daily.co",
              "worker-src 'self' blob:",
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