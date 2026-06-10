import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walk } from '../src/walk.js';

test('walk yields the root node first', () => {
  const schema = { type: 'object' };
  const nodes = [...walk(schema)];
  assert.equal(nodes[0].node, schema);
  assert.equal(nodes[0].depth, 0);
  assert.deepEqual(nodes[0].path, []);
});

test('walk descends into object properties with json-pointer-style paths', () => {
  const schema = {
    type: 'object',
    properties: {
      city: { type: 'string' },
      age: { type: 'integer' },
    },
  };
  const found = [...walk(schema)].map((n) => n.path.join('/'));
  assert.ok(found.includes('properties/city'));
  assert.ok(found.includes('properties/age'));
});

test('walk tracks depth for nested objects', () => {
  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  };
  const nameNode = [...walk(schema)].find(
    (n) => n.path.join('/') === 'properties/user/properties/name'
  );
  assert.equal(nameNode.depth, 2);
});

test('walk descends into array items', () => {
  const schema = {
    type: 'array',
    items: { type: 'string' },
  };
  const found = [...walk(schema)].map((n) => n.path.join('/'));
  assert.ok(found.includes('items'));
});

test('walk descends into combinators (anyOf/oneOf/allOf)', () => {
  const schema = {
    anyOf: [{ type: 'string' }, { type: 'number' }],
  };
  const found = [...walk(schema)].map((n) => n.path.join('/'));
  assert.ok(found.includes('anyOf/0'));
  assert.ok(found.includes('anyOf/1'));
});

test('walk ignores non-schema values', () => {
  const schema = { type: 'object', description: 'hi', properties: {} };
  const nodes = [...walk(schema)];
  // only the root is a schema object here
  assert.equal(nodes.length, 1);
});
