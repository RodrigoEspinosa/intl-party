import chalk from "chalk";
import ora from "ora";

export interface GenerateOptions {
  types?: boolean;
  schemas?: boolean;
  docs?: boolean;
  watch?: boolean;
  config?: string;
  verbose?: boolean;
}

export async function generateCommand(options: GenerateOptions) {
  console.log(chalk.blue("Generate command not yet implemented"));
  console.log("Options:", options);
}
