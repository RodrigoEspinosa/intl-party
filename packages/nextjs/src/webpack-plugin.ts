import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { watch } from "chokidar";

// Re-export Next.js integration utilities
export {
  withIntlParty,
  createNextConfigWithIntl,
  type NextIntegrationOptions,
} from "./next-integration";

export interface IntlPartyHotReloadOptions {
  /**
   * Path to the messages directory relative to the project root
   * @default './messages'
   */
  messagesPath?: string;

  /**
   * Path to the output directory for generated files
   * @default './src/lib/generated'
   */
  outputPath?: string;

  /**
   * Path to the CLI executable
   * @default Auto-detected from package structure
   */
  cliPath?: string;

  /**
   * Whether to enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Whether to enable the plugin
   * @default true
   */
  enabled?: boolean;
}

/**
 * Webpack plugin that automatically regenerates IntlParty translations
 * when message files change during development.
 */
export class IntlPartyHotReloadPlugin {
  private options: Required<IntlPartyHotReloadOptions>;
  private isRegenerating = false;
  private watcher: any = null;

  constructor(options: IntlPartyHotReloadOptions = {}) {
    this.options = {
      messagesPath: options.messagesPath || "./messages",
      outputPath: options.outputPath || "./src/lib/generated",
      cliPath: options.cliPath || this.detectCliPath(),
      verbose: options.verbose || false,
      enabled: options.enabled !== false,
    };
  }

  apply(compiler: any) {
    if (!compiler.options.mode || compiler.options.mode !== "development") {
      return;
    }

    if (!this.options.enabled) {
      return;
    }

    // Watch for changes in message files
    const messageFiles = this.getWatchPaths();

    if (messageFiles.length === 0) {
      if (this.options.verbose) {
        console.log("IntlParty: No message files found to watch");
      }
      return;
    }

    if (this.options.verbose) {
      console.log(
        `IntlParty: Plugin loaded, watching ${messageFiles.length} files:`,
        messageFiles
      );
    }

    // Use invalid hook to detect file changes
    compiler.hooks.invalid.tap(
      "IntlPartyHotReloadPlugin",
      (fileName: string | null) => {
        if (this.options.verbose) {
          console.log("IntlParty: File changed:", fileName);
        }

        // Check if the changed file is a message file
        if (
          fileName &&
          typeof fileName === "string" &&
          fileName.includes("/messages/") &&
          fileName.endsWith(".json")
        ) {
          if (!this.isRegenerating) {
            if (this.options.verbose) {
              console.log(
                "🔄 IntlParty: Message files changed, regenerating translations..."
              );
            }
            this.regenerateTranslations()
              .then(() => {
                if (this.options.verbose) {
                  console.log("✅ IntlParty: Translations regenerated");
                }
              })
              .catch((error) => {
                console.error(
                  "❌ IntlParty: Failed to regenerate translations:",
                  error
                );
              });
          }
        }
      }
    );

    // Also keep the watchRun hook as a fallback
    compiler.hooks.watchRun.tapAsync(
      "IntlPartyHotReloadPlugin",
      (compilation: any, callback: () => void) => {
        const changedFiles = compilation.modifiedFiles || new Set();

        if (this.options.verbose) {
          console.log("IntlParty: Changed files:", Array.from(changedFiles));
        }

        // Check if any message files have changed
        const hasMessageChanges = Array.from(changedFiles).some(
          (file: unknown) =>
            typeof file === "string" &&
            file.includes("/messages/") &&
            file.endsWith(".json")
        );

        if (hasMessageChanges && !this.isRegenerating) {
          if (this.options.verbose) {
            console.log(
              "🔄 IntlParty: Message files changed (watchRun), regenerating translations..."
            );
          }
          this.regenerateTranslations()
            .then(() => {
              if (this.options.verbose) {
                console.log("✅ IntlParty: Translations regenerated");
              }
              callback();
            })
            .catch((error) => {
              console.error(
                "❌ IntlParty: Failed to regenerate translations:",
                error
              );
              callback();
            });
        } else {
          callback();
        }
      }
    );

    // Set up chokidar file watcher as a backup
    this.watcher = watch(messageFiles, {
      ignoreInitial: true,
      persistent: true,
    });

    this.watcher.on("change", (filePath: string) => {
      if (this.options.verbose) {
        console.log(`IntlParty: File changed (chokidar): ${filePath}`);
      }

      if (!this.isRegenerating) {
        if (this.options.verbose) {
          console.log(
            "🔄 IntlParty: Message files changed (chokidar), regenerating translations..."
          );
        }
        this.regenerateTranslations()
          .then(() => {
            if (this.options.verbose) {
              console.log("✅ IntlParty: Translations regenerated");
            }
          })
          .catch((error) => {
            console.error(
              "❌ IntlParty: Failed to regenerate translations:",
              error
            );
          });
      }
    });

    // Clean up watcher when compiler is done
    compiler.hooks.done.tap("IntlPartyHotReloadPlugin", () => {
      if (this.watcher) {
        this.watcher.close();
      }
    });
  }

  private getWatchPaths(): string[] {
    const messagesDir = path.join(process.cwd(), this.options.messagesPath);
    const paths: string[] = [];

    if (fs.existsSync(messagesDir)) {
      const locales = fs.readdirSync(messagesDir);
      locales.forEach((locale) => {
        const localeDir = path.join(messagesDir, locale);
        if (fs.statSync(localeDir).isDirectory()) {
          const files = fs.readdirSync(localeDir);
          files.forEach((file) => {
            if (file.endsWith(".json")) {
              paths.push(path.join(localeDir, file));
            }
          });
        }
      });
    }

    return paths;
  }

  private async regenerateTranslations(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isRegenerating = true;

      const generateProcess = spawn(
        "node",
        [
          this.options.cliPath,
          "generate",
          "--client",
          "--types",
          "--output",
          this.options.outputPath,
        ],
        {
          cwd: process.cwd(),
          stdio: "pipe",
        }
      );

      let output = "";
      let errorOutput = "";

      generateProcess.stdout.on("data", (data) => {
        output += data.toString();
        if (this.options.verbose) {
          console.log(`IntlParty CLI: ${data.toString().trim()}`);
        }
      });

      generateProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
        if (this.options.verbose) {
          console.log(`IntlParty CLI Error: ${data.toString().trim()}`);
        }
      });

      generateProcess.on("close", (code) => {
        this.isRegenerating = false;
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`IntlParty CLI failed with code ${code}: ${errorOutput}`)
          );
        }
      });

      generateProcess.on("error", (error) => {
        this.isRegenerating = false;
        reject(error);
      });
    });
  }

  private detectCliPath(): string {
    // Try to detect the CLI path relative to the current package
    const possiblePaths = [
      // Monorepo structure
      path.join(process.cwd(), "../../packages/cli/dist/cli.js"),
      path.join(process.cwd(), "../cli/dist/cli.js"),
      // Node modules structure
      path.join(process.cwd(), "node_modules/@intl-party/cli/dist/cli.js"),
      // Global installation
      "intl-party",
    ];

    for (const cliPath of possiblePaths) {
      if (cliPath === "intl-party" || fs.existsSync(cliPath)) {
        return cliPath;
      }
    }

    // Fallback to a reasonable default
    return path.join(process.cwd(), "../../packages/cli/dist/cli.js");
  }
}

/**
 * Creates a Next.js webpack configuration that includes IntlParty hot reloading.
 * This is a convenience function that can be used in next.config.js.
 */
export function withIntlPartyHotReload(
  nextConfig: any = {},
  pluginOptions: IntlPartyHotReloadOptions = {}
) {
  return {
    ...nextConfig,
    webpack: (config: any, context: any) => {
      // Apply the plugin
      config.plugins = config.plugins || [];
      config.plugins.push(new IntlPartyHotReloadPlugin(pluginOptions));

      // Call the original webpack config if it exists
      if (nextConfig.webpack) {
        return nextConfig.webpack(config, context);
      }

      return config;
    },
  };
}
