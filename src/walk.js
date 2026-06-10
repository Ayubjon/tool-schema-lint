/**
 * Recursively walk a JSON Schema, yielding every subschema node along with
 * its location and nesting depth. Pure and dependency-free.
 *
 * Each yielded item is `{ node, path, depth, parentType }`:
 *   - node:       the subschema object
 *   - path:       array of string keys from the root (JSON-pointer-ish)
 *   - depth:      object-nesting depth (how many `properties`/`items` hops)
 *   - parentType: the keyword that led here ('properties' | 'items' |
 *                 'additionalProperties' | combinator name | null for root)
 *
 * @param {object} schema
 * @returns {Generator<{node: object, path: string[], depth: number, parentType: string|null}>}
 */
export function* walk(schema) {
  yield* walkNode(schema, [], 0, null);
}

const COMBINATORS = ['anyOf', 'oneOf', 'allOf'];

function isSchema(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function* walkNode(node, path, depth, parentType) {
  if (!isSchema(node)) return;
  yield { node, path, depth, parentType };

  if (isSchema(node.properties)) {
    for (const [key, child] of Object.entries(node.properties)) {
      yield* walkNode(child, [...path, 'properties', key], depth + 1, 'properties');
    }
  }

  if (isSchema(node.items)) {
    yield* walkNode(node.items, [...path, 'items'], depth + 1, 'items');
  } else if (Array.isArray(node.items)) {
    // tuple validation: items is an array of subschemas
    yield* walkArray(node.items, [...path, 'items'], depth + 1, 'items');
  }

  if (isSchema(node.additionalProperties)) {
    yield* walkNode(
      node.additionalProperties,
      [...path, 'additionalProperties'],
      depth + 1,
      'additionalProperties'
    );
  }

  for (const comb of COMBINATORS) {
    if (Array.isArray(node[comb])) {
      yield* walkArray(node[comb], [...path, comb], depth, comb);
    }
  }
}

function* walkArray(arr, path, depth, parentType) {
  for (let i = 0; i < arr.length; i++) {
    yield* walkNode(arr[i], [...path, String(i)], depth, parentType);
  }
}
