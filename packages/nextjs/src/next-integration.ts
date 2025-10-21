/**
 * Automatic Next.js integration
 * Integrates with Next.js build process for seamless i18n
 */

import type { NextConfig } from "next";

export interface NextIntegrationOptions {
  i18nConfig: {
    locales: string[];
    defaultLocale: string;
    messages?: string;
    localePrefix?: "always" | "as-needed" | "never";
  };
  autoGenerate?: boolean; // Auto-generate types during build
  watchMode?: boolean; // Watch for changes in development
}

/**
 * Enhances Next.js config with i18n integration
 */
export function withIntlParty(
  nextConfig: NextConfig = {},
  options: NextIntegrationOptions
): NextConfig {
  const { i18nConfig, autoGenerate = true, watchMode = true } = options;

  return {
    ...nextConfig,

    // Add webpack plugin for i18n
    webpack: async (config, context) => {
      // Apply user's webpack config first
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, context);
      }

      // Add i18n webpack plugin
      if (autoGenerate) {
        // Dynamic import to avoid bundling chokidar in client builds
        const { IntlPartyHotReloadPlugin } = await import("./webpack-plugin");

        config.plugins.push(
          new IntlPartyHotReloadPlugin({
            messagesPath: "./messages",
            outputPath: "./src/lib/generated",
            verbose: context.dev && watchMode,
          })
        );
      }

      return config;
    },

    // Add rewrites for clean URLs (if using cookie-based locale detection)
    async rewrites() {
      const userRewrites = await (nextConfig.rewrites?.() ?? []);

      if (i18nConfig.localePrefix !== "never") {
        return userRewrites;
      }

      // No rewrites needed for cookie-based detection
      return userRewrites;
    },

    // Add experimental features for better i18n support
    experimental: {
      ...nextConfig.experimental,
      // Enable server components externalization for better performance
      serverComponentsExternalPackages: [
        ...(nextConfig.experimental?.serverComponentsExternalPackages ?? []),
        "@intl-party/core",
        "@intl-party/react",
        "@intl-party/nextjs",
      ],
    },
  };
}

/**
 * Creates a Next.js config with i18n integration
 */
export function createNextConfigWithIntl(
  options: NextIntegrationOptions,
  nextConfig: NextConfig = {}
): NextConfig {
  return withIntlParty(nextConfig, options);
}
