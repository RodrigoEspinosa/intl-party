#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { validateCommand } from "./commands/validate";
import { extractCommand } from "./commands/extract";
import { syncCommand } from "./commands/sync";
import { initCommand } from "./commands/init";
import { checkCommand } from "./commands/check";
import { generateCommand } from "./commands/generate";
import { nextjsCommand } from "./commands/nextjs";

import packageJson from "../package.json" with { type: "json" };

program
  .name("intl-party")
  .description("CLI for IntlParty internationalization library")
  .version(packageJson.version);

// Global options
program
  .option("-c, --config <path>", "path to config file", "intl-party.config.js")
  .option("-v, --verbose", "verbose output")
  .option("--no-color", "disable colored output");

// Validate command
program
  .command("validate")
  .description("validate translation files for completeness and consistency")
  .option("-l, --locales <locales...>", "specific locales to validate")
  .option("-n, --namespaces <namespaces...>", "specific namespaces to validate")
  .option("--strict", "enable strict validation mode")
  .option("--format <format>", "output format (text|json|junit)", "text")
  .option("--output <file>", "output file path")
  .action(validateCommand);

// Extract command
program
  .command("extract")
  .description("extract translation keys from source code")
  .option("-s, --source <patterns...>", "source file patterns", [
    "src/**/*.{ts,tsx,js,jsx}",
  ])
  .option(
    "-o, --output <dir>",
    "output directory for extracted keys",
    "./messages"
  )
  .option("--dry-run", "show what would be extracted without writing files")
  .option("--update", "update existing translation files with new keys")
  .option("--remove-unused", "remove unused translation keys")
  .action(extractCommand);

// Sync command
program
  .command("sync")
  .description("synchronize translations across locales")
  .option("-b, --base <locale>", "base locale to sync from", "en")
  .option("-t, --target <locales...>", "target locales to sync to")
  .option("--missing-only", "only add missing keys, don't remove extras")
  .option("--interactive", "interactive mode for conflict resolution")
  .action(syncCommand);

// Init command
program
  .command("init")
  .description("initialize intl-party configuration and structure")
  .option("--force", "overwrite existing configuration")
  .option(
    "--template <template>",
    "template to use (nextjs|react|vanilla)",
    "react"
  )
  .action(initCommand);

// Check command
program
  .command("check")
  .description("check for issues in translations and configuration")
  .option("--missing", "check for missing translations")
  .option("--unused", "check for unused translation keys")
  .option("--duplicates", "check for duplicate keys")
  .option("--format-errors", "check for format errors in translations")
  .option("--fix", "automatically fix issues where possible")
  .action(checkCommand);

// Check-config command
program
  .command("check-config")
  .description("validate your intl-party configuration")
  .option("-c, --config <path>", "path to config file")
  .action(async (options) => {
    const { loadConfig } = await import("./utils/config");
    const spinner = (await import("ora"))
      .default("Validating configuration...")
      .start();
    try {
      const config = await loadConfig(options.config);
      spinner.succeed("Configuration is valid!");
      if (options.verbose) {
        console.log(JSON.stringify(config, null, 2));
      }
    } catch (error) {
      spinner.fail("Configuration is invalid");
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// Generate command
program
  .command("generate")
  .description("generate TypeScript definitions and other files")
  .option("-t, --types", "generate TypeScript type definitions")
  .option("-s, --schemas", "generate JSON schemas")
  .option("-d, --docs", "generate documentation")
  .option("-c, --client", "generate client package files")
  .option(
    "-o, --output <dir>",
    "output directory for generated files",
    "./node_modules/.intl-party"
  )
  .option("--watch", "watch for changes and regenerate")
  .option("--verbose", "verbose output")
  .action(generateCommand);

// Next.js command
program.addCommand(nextjsCommand);

// Add subcommands
program
  .command("completion")
  .description("generate shell completion scripts")
  .option("--shell <shell>", "shell type (bash|zsh|fish)", "bash")
  .action((_options) => {
    console.log("Shell completion not implemented yet");
  });

// Error handling
program.exitOverride((err) => {
  if (err.code === "commander.help") {
    process.exit(0);
  }
  if (err.code === "commander.version") {
    process.exit(0);
  }
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
