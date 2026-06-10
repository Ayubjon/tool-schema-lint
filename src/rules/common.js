import { walk } from '../walk.js';
import { finding, SEVERITY } from '../finding.js';

// Valid JSON Schema `type` values.
const VALID_TYPES = new Set([
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
]);

function hasCombinator(node) {
  return (
    Array.isArray(node.anyOf) ||
    Array.isArray(node.oneOf) ||
    Array.isArray(node.allOf) ||
    typeof node.$ref === 'string'
  );
}

/**
 * Provider-agnostic checks that improve any tool schema regardless of which
 * model will consume it. Each rule takes a tool `{ name, schema }` and returns
 * an array of Findings.
 */
export const commonRules = [
  function missingDescription(tool) {
    // A tool's description may live on the tool object (Anthropic/OpenAI tool
    // definitions) or on the schema itself (raw JSON Schema). Either satisfies.
    const toolDesc = typeof tool.description === 'string' && tool.description.trim();
    const schemaDesc =
      tool.schema && typeof tool.schema.description === 'string' && tool.schema.description.trim();
    if (!toolDesc && !schemaDesc) {
      return [
        finding(
          SEVERITY.WARNING,
          'missing-description',
          [],
          'Tool has no description. Models rely on it to decide when to call the tool.'
        ),
      ];
    }
    return [];
  },

  function missingPropertyDescription(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      // a "property" is anything reached via .../properties/<name>
      if (path.length >= 2 && path[path.length - 2] === 'properties') {
        if (typeof node.description !== 'string' || !node.description.trim()) {
          out.push(
            finding(
              SEVERITY.WARNING,
              'missing-property-description',
              path,
              `Property "${path[path.length - 1]}" has no description; descriptions sharply improve argument quality.`
            )
          );
        }
      }
    }
    return out;
  },

  function missingType(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (node.type === undefined && node.enum === undefined && node.const === undefined && !hasCombinator(node)) {
        out.push(
          finding(
            SEVERITY.WARNING,
            'missing-type',
            path,
            'Subschema has no "type", "enum", "const", or combinator; the model has no shape to follow.'
          )
        );
      }
    }
    return out;
  },

  function unknownType(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
      for (const t of types) {
        if (!VALID_TYPES.has(t)) {
          out.push(
            finding(
              SEVERITY.ERROR,
              'unknown-type',
              path,
              `"${t}" is not a valid JSON Schema type.`
            )
          );
        }
      }
    }
    return out;
  },

  function requiredUnknownProperty(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (Array.isArray(node.required) && node.properties && typeof node.properties === 'object') {
        for (const key of node.required) {
          if (!(key in node.properties)) {
            out.push(
              finding(
                SEVERITY.ERROR,
                'required-unknown-property',
                path,
                `"${key}" is listed in "required" but is not defined in "properties".`
              )
            );
          }
        }
      }
    }
    return out;
  },

  function arrayWithoutItems(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      const isArray = node.type === 'array' || (Array.isArray(node.type) && node.type.includes('array'));
      if (isArray && node.items === undefined && node.prefixItems === undefined) {
        out.push(
          finding(
            SEVERITY.WARNING,
            'array-without-items',
            path,
            'Array has no "items" schema, so the model has no shape for its elements.'
          )
        );
      }
    }
    return out;
  },

  function objectWithoutProperties(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      const isObject = node.type === 'object' || (Array.isArray(node.type) && node.type.includes('object'));
      const hasShape =
        (node.properties && Object.keys(node.properties).length > 0) ||
        node.additionalProperties !== undefined ||
        node.patternProperties !== undefined ||
        node.$ref !== undefined;
      if (isObject && !hasShape) {
        out.push(
          finding(
            SEVERITY.INFO,
            'object-without-properties',
            path,
            'Object declares no "properties"; the model has no fields to fill in.'
          )
        );
      }
    }
    return out;
  },

  function emptyEnum(tool) {
    const out = [];
    for (const { node, path } of walk(tool.schema)) {
      if (Array.isArray(node.enum) && node.enum.length === 0) {
        out.push(
          finding(
            SEVERITY.ERROR,
            'empty-enum',
            path,
            'Empty "enum" means no value can ever validate.'
          )
        );
      }
    }
    return out;
  },
];
