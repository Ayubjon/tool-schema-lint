/**
 * Parse CLI arguments into an options object. Pure and side-effect free so it
 * can be unit-tested without spawning a process.
 *
 * @param {string[]} argv  arguments after `node cli.js`
 * @returns {{file?:string, provider:string, json:boolean, color:boolean,
 *            strict:boolean, maxDepth:(number|undefined), help:boolean,
 *            version:boolean, quiet:boolean}}
 */
export function parseArgs(argv) {
  const opts = {
    file: undefined,
    provider: 'all',
    json: false,
    color: true,
    strict: true,
    maxDepth: undefined,
    help: false,
    version: false,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inlineValue] = splitInline(arg);
    const next = () => (inlineValue !== undefined ? inlineValue : argv[++i]);

    switch (flag) {
      case '--help':
      case '-h':
        opts.help = true;
        break;
      case '--version':
      case '-v':
        opts.version = true;
        break;
      case '--json':
        opts.json = true;
        break;
      case '--no-color':
        opts.color = false;
        break;
      case '--quiet':
      case '-q':
        opts.quiet = true;
        break;
      case '--strict':
        opts.strict = true;
        break;
      case '--no-strict':
        opts.strict = false;
        break;
      case '--provider':
      case '-p':
        opts.provider = next();
        break;
      case '--max-depth':
        opts.maxDepth = Number(next());
        break;
      default:
        if (flag.startsWith('-')) {
          throw new Error(`Unknown flag: ${flag}`);
        }
        opts.file = arg;
    }
  }

  return opts;
}

function splitInline(arg) {
  const eq = arg.indexOf('=');
  if (arg.startsWith('--') && eq !== -1) {
    return [arg.slice(0, eq), arg.slice(eq + 1)];
  }
  return [arg, undefined];
}
