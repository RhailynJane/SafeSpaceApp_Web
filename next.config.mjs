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
