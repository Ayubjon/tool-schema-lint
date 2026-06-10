import { extractTools } from './extract.js';
import { commonRules } from './rules/common.js';
import { openaiRules } from './rules/openai.js';
import { anthropicRules } from './rules/anthropic.js';
import { geminiRules } from './rules/gemini.js';

const PROVIDER_RULES = {
  openai: openaiRules,
  anthropic: anthropicRules,
  gemini: geminiRules,
};

export const PROVIDERS = Object.keys(PROVIDER_RULES);

/**
 * Lint one or many tool definitions.
 *
 * @param {unknown} input  a tool definition, array, or { tools: [...] }
 * @param {object} [options]
 * @param {('openai'|'anthropic'|'gemini'|'all'|string[])} [options.provider='all']
 * @param {boolean} [options.strict=true]   OpenAI strict-mode enforcement
 * @param {number}  [options.maxDepth=5]    nesting-depth warning threshold
 * @returns {{ok: boolean, tools: Array, summary: {errors:number, warnings:number, info:number}}}
 */
export function lint(input, options = {}) {
  const providers = resolveProviders(options.provider);
  const tools = extractTools(input);

  const reportTools = tools.map((tool) => {
    const findings = [];

    for (const rule of commonRules) {
      findings.push(...rule(tool, options));
    }
    for (const provider of providers) {
      for (const rule of PROVIDER_RULES[provider]) {
        for (const f of rule(tool, options)) {
          findings.push({ ...f, provider });
        }
      }
    }

    // tag every finding with the owning tool name
    for (const f of findings) f.tool = tool.name;

    return { name: tool.name, format: tool.format, findings };
  });

  const summary = { errors: 0, warnings: 0, info: 0 };
  for (const t of reportTools) {
    for (const f of t.findings) {
      if (f.severity === 'error') summary.errors++;
      else if (f.severity === 'warning') summary.warnings++;
      else summary.info++;
    }
  }

  return { ok: summary.errors === 0, tools: reportTools, summary };
}

function resolveProviders(provider) {
  if (!provider || provider === 'all') return PROVIDERS;
  if (Array.isArray(provider)) {
    return provider.filter((p) => PROVIDER_RULES[p]);
  }
  if (PROVIDER_RULES[provider]) return [provider];
  throw new Error(`Unknown provider "${provider}". Use one of: ${PROVIDERS.join(', ')}, all.`);
}
