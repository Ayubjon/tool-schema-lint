import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commonRules } from '../src/rules/common.js';

function run(schema) {
  const tool = { name: 't', schema };
  return commonRules.flatMap((rule) => rule(tool));
}

function rules(findings) {
  return findings.map((f) => f.rule);
}

test('flags a missing description on the root schema', () => {
  const findings = run({ type: 'object', properties: {} });
  assert.ok(rules(findings).includes('missing-description'));
});

test('flags a property with no description', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: { city: { type: 'string' } },
  });
  assert.ok(rules(findings).includes('missing-property-description'));
});

test('does not flag a property that has a description', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: { city: { type: 'string', description: 'the city' } },
  });
  assert.ok(!rules(findings).includes('missing-property-description'));
});

test('flags a node with a missing type', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: { city: { description: 'no type here' } },
  });
  assert.ok(rules(findings).includes('missing-type'));
});

test('flags an unknown JSON Schema type', () => {
  const findings = run({ type: 'objct', description: 'typo' });
  assert.ok(rules(findings).includes('unknown-type'));
});

test('flags an object property declared but absent from properties', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: { a: { type: 'string', description: 'a' } },
    required: ['a', 'b'],
  });
  assert.ok(rules(findings).includes('required-unknown-property'));
});

test('flags an empty enum', () => {
  const findings = run({
    type: 'string',
    description: 'x',
    enum: [],
  });
  assert.ok(rules(findings).includes('empty-enum'));
});

test('flags an array with no items schema', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: { tags: { type: 'array', description: 'tags' } },
  });
  assert.ok(rules(findings).includes('array-without-items'));
});

test('flags an object type that declares no properties', () => {
  const findings = run({
    type: 'object',
    description: 'root',
    properties: {
      meta: { type: 'object', description: 'meta' },
    },
  });
  assert.ok(rules(findings).includes('object-without-properties'));
});

test('a clean schema produces no error-level findings', () => {
  const findings = run({
    type: 'object',
    description: 'A clean tool',
    properties: { city: { type: 'string', description: 'city name' } },
    required: ['city'],
  });
  assert.ok(!findings.some((f) => f.severity === 'error'));
});
