import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../utils/config";
import { loadTranslations } from "../utils/translations";
import { validateTranslations } from "@intl-party/core";

export interface CheckOptions {
  missing?: boolean;
  formatErrors?: boolean;
  config?: string;
  verbose?: boolean;
}

export async function checkCommand(options: CheckOptions) {
  const spinner = ora("Loading configuration...").start();

  try {
    // Load configuration
    const config = await loadConfig(options.config);
    spinner.succeed("Configuration loaded");

    // Load translations
    spinner.start("Loading translations...");
    const translations = await loadTranslations(
      config.translationPaths,
      config.locales,
      config.namespaces,
    );
    spinner.succeed("Translations loaded");

    // Perform checks
    const issues: Array<{
      type: string;
      severity: "error" | "warning";
      message: string;
      locale?: string;
      namespace?: string;
      key?: string;
    }> = [];

    // Check for missing translations
    if (options.missing !== false) {
      spinner.start("Checking for missing translations...");

      const validationResult = validateTranslations(
        translations,
        config.locales,
        config.namespaces,
        { strict: true },
      );

      validationResult.errors.forEach((error) => {
        if (
          error.type === "missing_key" ||
          error.type === "missing_namespace"
        ) {
          issues.push({
            type: "missing",
            severity: "error",
            message: error.message,
            locale: error.locale,
            namespace: error.namespace,
            key: error.key,
          });
        }
      });

      spinner.succeed(
        `Missing translations check completed (${issues.length} issues found)`,
      );
    }

    // Check for format errors
    if (options.formatErrors !== false) {
      spinner.start("Checking for format errors...");

      const validationResult = validateTranslations(
        translations,
        config.locales,
        config.namespaces,
        { validateFormats: true },
      );

      validationResult.errors.forEach((error) => {
        if (error.type === "invalid_format") {
          issues.push({
            type: "format",
            severity: "error",
            message: error.message,
            locale: error.locale,
            namespace: error.namespace,
            key: error.key,
          });
        }
      });

      spinner.succeed("Format errors check completed");
    }

    // Report results
    if (issues.length === 0) {
      console.log(chalk.green("✓ No issues found!"));
      return;
    }

    console.log(chalk.red(`\n✗ Found ${issues.length} issue(s):\n`));

    // Group issues by type
    const groupedIssues = issues.reduce(
      (acc, issue) => {
        if (!acc[issue.type]) {
          acc[issue.type] = [];
        }
        acc[issue.type].push(issue);
        return acc;
      },
      {} as Record<string, typeof issues>,
    );

    // Display issues
    for (const [type, typeIssues] of Object.entries(groupedIssues)) {
      console.log(
        chalk.bold(`${type.toUpperCase()} ISSUES (${typeIssues.length}):`),
      );

      typeIssues.forEach((issue, index) => {
        const icon =
          issue.severity === "error" ? chalk.red("✗") : chalk.yellow("⚠");
        const location =
          issue.locale && issue.namespace
            ? chalk.gray(
                `[${issue.locale}/${issue.namespace}${issue.key ? `/${issue.key}` : ""}]`,
              )
            : "";

        console.log(`  ${index + 1}. ${icon} ${issue.message} ${location}`);
      });

      console.log();
    }

    // Exit with error code if there are errors
    const errorCount = issues.filter(
      (issue) => issue.severity === "error",
    ).length;
    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Check failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
