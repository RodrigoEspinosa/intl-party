import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { validateTranslations } from "@intl-party/core";
import { loadConfig } from "../utils/config";
import { loadTranslations } from "../utils/translations";

export interface ValidateOptions {
  locales?: string[];
  namespaces?: string[];
  strict?: boolean;
  format?: "text" | "json" | "junit";
  output?: string;
  config?: string;
  verbose?: boolean;
}

export async function validateCommand(options: ValidateOptions) {
  const spinner = ora("Loading configuration...").start();

  try {
    // Load configuration
    const config = await loadConfig(options.config);
    spinner.succeed("Configuration loaded");

    // Filter locales and namespaces if specified
    const targetLocales = options.locales || config.locales;
    const targetNamespaces = options.namespaces || config.namespaces;

    spinner.start("Loading translations...");

    // Load all translations
    const translations = await loadTranslations(
      config.translationPaths,
      targetLocales,
      targetNamespaces,
    );

    spinner.succeed("Translations loaded");
    spinner.start("Validating translations...");

    // Validate translations
    const validationConfig = {
      strict: options.strict || config.validation?.strict || false,
      logMissing: options.verbose || false,
      throwOnMissing: false,
      validateFormats: true,
    };

    const result = validateTranslations(
      translations,
      targetLocales,
      targetNamespaces,
      validationConfig,
    );

    spinner.stop();

    // Output results
    await outputResults(result, options);

    // Exit with appropriate code
    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Validation failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function outputResults(result: any, options: ValidateOptions) {
  if (options.format === "json") {
    const output = JSON.stringify(result, null, 2);

    if (options.output) {
      await fs.writeFile(options.output, output);
      console.log(chalk.green("✓"), `Results written to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (options.format === "junit") {
    const junitXml = generateJUnitXML(result);

    if (options.output) {
      await fs.writeFile(options.output, junitXml);
      console.log(
        chalk.green("✓"),
        `JUnit report written to ${options.output}`,
      );
    } else {
      console.log(junitXml);
    }
    return;
  }

  // Text format (default)
  if (result.valid) {
    console.log(chalk.green("✓ All translations are valid!"));

    if (result.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠ ${result.warnings.length} warning(s):`));

      result.warnings.forEach((warning: any, index: number) => {
        console.log(
          `  ${index + 1}. ${chalk.yellow(warning.type)}: ${warning.message}`,
        );
        if (options.verbose) {
          console.log(
            `     Locale: ${warning.locale}, Namespace: ${warning.namespace}, Key: ${warning.key}`,
          );
        }
      });
    }
  } else {
    console.log(
      chalk.red(`✗ Validation failed with ${result.errors.length} error(s):`),
    );

    result.errors.forEach((error: any, index: number) => {
      console.log(`  ${index + 1}. ${chalk.red(error.type)}: ${error.message}`);
      if (options.verbose) {
        console.log(
          `     Locale: ${error.locale}, Namespace: ${error.namespace}, Key: ${error.key}`,
        );
      }
    });

    if (result.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠ ${result.warnings.length} warning(s):`));

      result.warnings.forEach((warning: any, index: number) => {
        console.log(
          `  ${index + 1}. ${chalk.yellow(warning.type)}: ${warning.message}`,
        );
        if (options.verbose) {
          console.log(
            `     Locale: ${warning.locale}, Namespace: ${warning.namespace}, Key: ${warning.key}`,
          );
        }
      });
    }
  }

  // Summary
  const totalIssues = result.errors.length + result.warnings.length;
  if (totalIssues > 0) {
    console.log(
      `\nSummary: ${result.errors.length} errors, ${result.warnings.length} warnings`,
    );
  }
}

function generateJUnitXML(result: any): string {
  const totalTests = 1;
  const failures = result.valid ? 0 : 1;
  const errors = result.errors.length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="intl-party-validation" tests="${totalTests}" failures="${failures}" errors="${errors}">\n`;
  xml += `  <testsuite name="translation-validation" tests="${totalTests}" failures="${failures}" errors="${errors}">\n`;

  if (result.valid) {
    xml += `    <testcase name="validation" classname="translations" />\n`;
  } else {
    xml += `    <testcase name="validation" classname="translations">\n`;
    xml += `      <failure message="Translation validation failed">\n`;
    xml += `        <![CDATA[\n`;

    result.errors.forEach((error: any) => {
      xml += `${error.type}: ${error.message}\n`;
      xml += `  Locale: ${error.locale}, Namespace: ${error.namespace}, Key: ${error.key}\n\n`;
    });

    xml += `        ]]>\n`;
    xml += `      </failure>\n`;
    xml += `    </testcase>\n`;
  }

  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;

  return xml;
}
