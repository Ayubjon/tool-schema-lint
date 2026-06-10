const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
};

const ICON = { error: '✖', warning: '⚠', info: 'ℹ' };
const COLOR = { error: 'red', warning: 'yellow', info: 'blue' };

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

/**
 * Render a lint report as a human-readable string.
 * @param {object} report  output of lint()
 * @param {object} [opts]
 * @param {boolean} [opts.color=true]
 */
export function formatText(report, opts = {}) {
  const color = opts.color !== false;
  const c = (name, s) => (color ? ANSI[name] + s + ANSI.reset : s);

  const lines = [];

  for (const tool of report.tools) {
    const header = `${c('bold', tool.name)} ${c('gray', `[${tool.format}]`)}`;
    lines.push(header);

    if (tool.findings.length === 0) {
      lines.push('  ' + c('green', '✓ no issues'));
      lines.push('');
      continue;
    }

    const sorted = [...tool.findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
    for (const f of sorted) {
      const icon = c(COLOR[f.severity], ICON[f.severity]);
      const loc = f.path ? c('gray', `at ${f.path}`) : c('gray', 'at <root>');
      const prov = f.provider ? c('gray', `(${f.provider})`) : '';
      const rule = c('dim', f.rule);
      lines.push(`  ${icon} ${loc} ${prov}`);
      lines.push(`    ${f.message} ${rule}`);
    }
    lines.push('');
  }

  const { errors, warnings, info } = report.summary;
  const summary = `${errors} error${plural(errors)}, ${warnings} warning${plural(warnings)}, ${info} info`;
  if (errors === 0 && warnings === 0 && info === 0) {
    lines.push(c('green', '✓ All clean — 0 errors, 0 warnings.'));
  } else {
    const tone = errors > 0 ? 'red' : warnings > 0 ? 'yellow' : 'blue';
    lines.push(c(tone, c('bold', summary)));
  }

  return lines.join('\n');
}

function plural(n) {
  return n === 1 ? '' : 's';
}

/** Render a report as pretty JSON. */
export function formatJson(report) {
  return JSON.stringify(report, null, 2);
}
