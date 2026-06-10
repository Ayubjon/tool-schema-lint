#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from '../src/cli-args.js';
import { lint, PROVIDERS } from '../src/lint.js';
import { formatText, formatJson } from '../src/format.js';

const VERSION = '0.1.0';

const HELP = `tool-schema-lint v${VERSION}
Lint LLM function-calling / tool-use JSON Schemas for provider compatibility.

USAGE
  tool-schema-lint [file] [options]
  cat tools.json | tool-schema-lint --provider openai

ARGUMENTS
  file                 Path to a JSON file with a tool definition, an array of
                       them, or a { "tools": [...] } envelope. Reads stdin if
                       omitted.

OPTIONS
  -p, --provider <p>   Target provider: ${PROVIDERS.join(', ')}, or all (default: all)
      --no-strict      Disable OpenAI strict-mode checks (additionalProperties,
                       all-required)
      --max-depth <n>  Nesting-depth warning threshold (default: 5)
      --json           Output the full report as JSON
      --no-color       Disable ANSI colors
  -q, --quiet          Only print on failure
  -h, --help           Show this help
  -v, --version        Show version

EXIT CODES
  0  no errors        1  one or more errors        2  bad usage / invalid input

EXAMPLES
  tool-schema-lint weather_tool.json --provider openai
  tool-schema-lint tools.json --provider all --json
`;

function readInput(file) {
  if (file) return readFileSync(file, 'utf8');
  return readFileSync(0, 'utf8'); // stdin
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\nRun with --help for usage.\n`);
    process.exit(2);
  }

  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (opts.version) {
    process.stdout.write(`${VERSION}\n`);
    process.exit(0);
  }

  let raw;
  try {
    raw = readInput(opts.file);
  } catch (err) {
    process.stderr.write(`Could not read input: ${err.message}\n`);
    process.exit(2);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`Invalid JSON: ${err.message}\n`);
    process.exit(2);
  }

  let report;
  try {
    report = lint(data, {
      provider: opts.provider,
      strict: opts.strict,
      maxDepth: opts.maxDepth,
    });
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }

  if (opts.json) {
    process.stdout.write(formatJson(report) + '\n');
  } else if (!opts.quiet || !report.ok) {
    process.stdout.write(formatText(report, { color: opts.color }) + '\n');
  }

  process.exit(report.ok ? 0 : 1);
}

main();
