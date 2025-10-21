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

// Zero-config: Only apply IntlParty hot reloading plugin in development
if (process.env.NODE_ENV === "development") {
  const { withIntlPartyHotReload } = require("@intl-party/nextjs/webpack-plugin");
  module.exports = withIntlPartyHotReload(nextConfig);
} else {
  module.exports = nextConfig;
}
