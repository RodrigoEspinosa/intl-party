/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: "standalone",
  webpack: (config, { isServer }) => {
    // Handle .intl-party directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '.intl-party': require('path').resolve('./node_modules/.intl-party'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
