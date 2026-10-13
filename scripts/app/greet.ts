// A minimal CLI template: a pure function plus the main/isEntryPoint wiring every script here
// uses, so a new script application can be copied from a working, tested example.
import { EXIT_ERROR, EXIT_OK, consoleOutput, isEntryPoint, runCli, type Output } from "../lib/cli.ts";

const USAGE = "usage: greet [name]";

/** The greeting for a name, falling back to the world when the name is empty. */
export function greet(name: string): string {
  return `Hello, ${name === "" ? "world" : name}!`;
}

/** greet [name]: prints one greeting. No name greets the world; more than one is a usage error. */
export function main(args: readonly string[], output: Output = consoleOutput): number {
  if (args.length > 1) {
    output.warn(USAGE);
    return EXIT_ERROR;
  }
  output.write(greet(args[0] ?? ""));
  return EXIT_OK;
}

if (isEntryPoint(import.meta.url)) await runCli(() => main(process.argv.slice(2)));
