import { walk } from '../walk.js';
import { finding, SEVERITY } from '../finding.js';

/**
 * Gemini function declarations accept only a subset of the OpenAPI 3.0 Schema
 * object. These rules flag JSON Schema features Gemini will reject or ignore.
 * @see https://ai.google.dev/gemini-api/docs/function-calling
 */

// `format` values Gemini understands, by base type.
const SUPPORTED_FORMATS = {
  string: new Set(['enum', 'date-time']),
  number: new Set(['float', 'double']),
  integer: new Set(['int32', 'int64']),
};

// Keywords Gemini silently ignores rather than honoring.
const IGNORED_KEYWORDS = ['additionalProperties', 'default', 'patternProperties', '$schema'];

export const geminiRules = [
  function noRef(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (typeof node.$ref === 'string') {
        out.push(
          finding(
            SEVERITY.ERROR,
            'gemini-no-ref',
            path,
            'Gemini does not support "$ref"; inline the referenced schema instead.'
          )
        );
      }
    }
    return out;
  },

  function nullableType(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      const isNullUnion = Array.isArray(node.type) && node.type.includes('null');
      const isNullType = node.type === 'null';
      if (isNullUnion || isNullType) {
        out.push(
          finding(
            SEVERITY.ERROR,
            'gemini-nullable-type',
            path,
            'Gemini expresses nullability with "nullable": true, not a "null" type or type array.'
          )
        );
      }
    }
    return out;
  },

  function unsupportedCombinator(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      for (const kw of ['oneOf', 'allOf', 'not']) {
        if (kw in node) {
          out.push(
            finding(
              SEVERITY.WARNING,
              'gemini-unsupported-combinator',
              path,
              `Gemini does not support "${kw}"; only "anyOf" is accepted among combinators.`
            )
          );
        }
      }
    }
    return out;
  },

  function unsupportedFormat(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (typeof node.format !== 'string') continue;
      const base = Array.isArray(node.type) ? node.type[0] : node.type;
      const allowed = SUPPORTED_FORMATS[base];
      if (allowed && !allowed.has(node.format)) {
        out.push(
          finding(
            SEVERITY.WARNING,
            'gemini-unsupported-format',
            path,
            `Gemini ignores format "${node.format}" for type "${base}". Supported: ${[...allowed].join(', ')}.`
          )
        );
      }
    }
    return out;
  },

  function ignoredKeyword(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      for (const kw of IGNORED_KEYWORDS) {
        if (kw in node) {
          out.push(
            finding(
              SEVERITY.WARNING,
              'gemini-ignored-keyword',
              path,
              `Gemini ignores "${kw}"; it has no effect on validation or generation.`
            )
          );
        }
      }
    }
    return out;
  },
];
