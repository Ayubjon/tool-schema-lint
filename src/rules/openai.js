import { walk } from '../walk.js';
import { finding, SEVERITY } from '../finding.js';

/**
 * Keywords that OpenAI Structured Outputs / strict function calling does not
 * support. Present-but-unsupported keywords are silently ignored by the API,
 * which usually means the schema does not behave the way the author expects.
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */
const UNSUPPORTED_KEYWORDS = [
  'patternProperties',
  'unevaluatedProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'dependentRequired',
  'dependentSchemas',
  'oneOf',
];

const DEFAULT_MAX_DEPTH = 5;

/**
 * OpenAI strict-mode rules. Options:
 *   - strict (default true): enforce additionalProperties:false + all-required
 *   - maxDepth (default 5):  warn when object nesting goes deeper
 */
export const openaiRules = [
  function rootMustBeObject(tool) {
    const t = tool.schema?.type;
    const isObject = t === 'object' || (Array.isArray(t) && t.includes('object'));
    if (!isObject) {
      return [
        finding(
          SEVERITY.ERROR,
          'openai-root-object',
          [],
          'OpenAI requires a tool\'s top-level parameters schema to be of type "object".'
        ),
      ];
    }
    return [];
  },

  function additionalPropertiesFalse(tool, options = {}) {
    if (options.strict === false) return [];
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (isObjectNode(node) && node.additionalProperties !== false) {
        out.push(
          finding(
            SEVERITY.ERROR,
            'openai-additional-properties',
            path,
            'Strict mode requires every object to set "additionalProperties": false.'
          )
        );
      }
    }
    return out;
  },

  function allPropertiesRequired(tool, options = {}) {
    if (options.strict === false) return [];
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (isObjectNode(node)) {
        const keys = Object.keys(node.properties);
        const required = Array.isArray(node.required) ? node.required : [];
        const missing = keys.filter((k) => !required.includes(k));
        if (missing.length > 0) {
          out.push(
            finding(
              SEVERITY.ERROR,
              'openai-all-required',
              path,
              `Strict mode requires every property in "required". Missing: ${missing.join(', ')}. Make a field optional by giving it a nullable type, e.g. ["string","null"].`
            )
          );
        }
      }
    }
    return out;
  },

  function unsupportedKeywords(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      for (const kw of UNSUPPORTED_KEYWORDS) {
        if (kw in node) {
          out.push(
            finding(
              SEVERITY.WARNING,
              'openai-unsupported-keyword',
              path,
              `"${kw}" is not supported by OpenAI structured outputs and will be ignored.`
            )
          );
        }
      }
    }
    return out;
  },

  function maxDepth(tool, options = {}) {
    const limit = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const out = [];
    let deepest = null;
    for (const { path, depth } of walk(tool.schema)) {
      if (depth > limit && (!deepest || depth > deepest.depth)) {
        deepest = { path, depth };
      }
    }
    if (deepest) {
      out.push(
        finding(
          SEVERITY.WARNING,
          'openai-max-depth',
          deepest.path,
          `Nesting depth ${deepest.depth} exceeds the recommended limit of ${limit}; deeply nested schemas degrade tool-call reliability.`
        )
      );
    }
    return out;
  },
];

function isObjectNode(node) {
  return (
    (node.type === 'object' || (Array.isArray(node.type) && node.type.includes('object'))) &&
    node.properties &&
    typeof node.properties === 'object'
  );
}
