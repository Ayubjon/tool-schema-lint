import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openaiRules } from '../src/rules/openai.js';

function run(schema, options) {
  const tool = { name: 't', schema };
  return openaiRules.flatMap((rule) => rule(tool, options ?? {}));
}
const ruleIds = (findings) => findings.map((f) => f.rule);

test('errors when an object is missing additionalProperties:false (strict)', () => {
  const findings = run({
    type: 'object',
    properties: { a: { type: 'string' } },
    required: ['a'],
  });
  assert.ok(ruleIds(findings).includes('openai-additional-properties'));
});

test('does not flag additionalProperties when set to false', () => {
  const findings = run({
    type: 'object',
    additionalProperties: false,
    properties: { a: { type: 'string' } },
    required: ['a'],
  });
  assert.ok(!ruleIds(findings).includes('openai-additional-properties'));
});

test('errors when not every property is required (strict)', () => {
  const findings = run({
    type: 'object',
    additionalProperties: false,
    properties: { a: { type: 'string' }, b: { type: 'string' } },
    required: ['a'],
  });
  assert.ok(ruleIds(findings).includes('openai-all-required'));
});

test('does not flag all-required when every key is required', () => {
  const findings = run({
    type: 'object',
    additionalProperties: false,
    properties: { a: { type: 'string' }, b: { type: 'string' } },
    required: ['a', 'b'],
  });
  assert.ok(!ruleIds(findings).includes('openai-all-required'));
});

test('errors when the root is not an object', () => {
  const findings = run({ type: 'string' });
  assert.ok(ruleIds(findings).includes('openai-root-object'));
});

test('warns on unsupported strict-mode keywords like patternProperties', () => {
  const findings = run({
    type: 'object',
    additionalProperties: false,
    properties: { a: { type: 'string' } },
    required: ['a'],
    patternProperties: { '^x': { type: 'string' } },
  });
  assert.ok(ruleIds(findings).includes('openai-unsupported-keyword'));
});

test('warns when nesting exceeds the configured maxDepth', () => {
  const findings = run(
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        a: {
          type: 'object',
          additionalProperties: false,
          properties: { b: { type: 'string', description: 'x' } },
          required: ['b'],
        },
      },
      required: ['a'],
    },
    { maxDepth: 1 }
  );
  assert.ok(ruleIds(findings).includes('openai-max-depth'));
});

test('strict:false disables the additionalProperties and all-required rules', () => {
  const findings = run(
    { type: 'object', properties: { a: { type: 'string' } } },
    { strict: false }
  );
  assert.ok(!ruleIds(findings).includes('openai-additional-properties'));
  assert.ok(!ruleIds(findings).includes('openai-all-required'));
});
