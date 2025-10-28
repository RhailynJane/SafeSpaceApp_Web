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


webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

export default nextConfig;