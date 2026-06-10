import { finding, SEVERITY } from '../finding.js';

/**
 * Anthropic tool-use rules. Anthropic accepts standard JSON Schema for
 * `input_schema` but imposes a few hard constraints and strongly rewards
 * thorough descriptions.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */

// Anthropic tool names must match this pattern.
const NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const THIN_DESCRIPTION_CHARS = 20;

export const anthropicRules = [
  function rootMustBeObject(tool) {
    const t = tool.schema?.type;
    const isObject = t === 'object' || (Array.isArray(t) && t.includes('object'));
    if (!isObject) {
      return [
        finding(
          SEVERITY.ERROR,
          'anthropic-root-object',
          [],
          'Anthropic requires "input_schema" to be of type "object".'
        ),
      ];
    }
    return [];
  },

  function toolName(tool) {
    if (tool.name && tool.name !== '(anonymous)' && !NAME_RE.test(tool.name)) {
      return [
        finding(
          SEVERITY.ERROR,
          'anthropic-tool-name',
          [],
          `Tool name "${tool.name}" must match ^[a-zA-Z0-9_-]{1,64}$ (letters, digits, underscore, hyphen; max 64 chars).`
        ),
      ];
    }
    return [];
  },

  function thinDescription(tool) {
    const desc = tool.description;
    if (typeof desc === 'string' && desc.trim().length > 0 && desc.trim().length < THIN_DESCRIPTION_CHARS) {
      return [
        finding(
          SEVERITY.WARNING,
          'anthropic-thin-description',
          [],
          `Tool description is only ${desc.trim().length} characters. Claude leans heavily on detailed tool descriptions to decide when and how to call a tool.`
        ),
      ];
    }
    return [];
  },
];
