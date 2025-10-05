import chalk from "chalk";
import ora from "ora";

export interface SyncOptions {
  base?: string;
  target?: string[];
  missingOnly?: boolean;
  interactive?: boolean;
  config?: string;
  verbose?: boolean;
}

export async function syncCommand(options: SyncOptions) {
  console.log(chalk.blue("Sync command not yet implemented"));
  console.log("Options:", options);
}
