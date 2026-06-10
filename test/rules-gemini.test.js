import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiRules } from '../src/rules/gemini.js';

function run(schema) {
  const tool = { name: 't', schema };
  return geminiRules.flatMap((rule) => rule(tool));
}
const ruleIds = (findings) => findings.map((f) => f.rule);

test('errors on a $ref (Gemini does not support references)', () => {
  const findings = run({
    type: 'object',
    properties: { a: { $ref: '#/$defs/Thing' } },
  });
  assert.ok(ruleIds(findings).includes('gemini-no-ref'));
});

test('errors on a type:null member (use nullable:true instead)', () => {
  const findings = run({
    type: 'object',
    properties: { a: { type: ['string', 'null'] } },
  });
  assert.ok(ruleIds(findings).includes('gemini-nullable-type'));
});

test('warns on an unsupported combinator like oneOf', () => {
  const findings = run({
    type: 'object',
    properties: { a: { oneOf: [{ type: 'string' }, { type: 'number' }] } },
  });
  assert.ok(ruleIds(findings).includes('gemini-unsupported-combinator'));
});

test('warns on an unsupported string format', () => {
  const findings = run({
    type: 'object',
    properties: { a: { type: 'string', format: 'email' } },
  });
  assert.ok(ruleIds(findings).includes('gemini-unsupported-format'));
});

test('does not warn on a supported string format (date-time)', () => {
  const findings = run({
    type: 'object',
    properties: { a: { type: 'string', format: 'date-time' } },
  });
  assert.ok(!ruleIds(findings).includes('gemini-unsupported-format'));
});

test('warns on ignored keywords like additionalProperties / default', () => {
  const findings = run({
    type: 'object',
    additionalProperties: false,
    properties: { a: { type: 'string', default: 'x' } },
  });
  const ids = ruleIds(findings);
  assert.ok(ids.includes('gemini-ignored-keyword'));
});

test('a plain supported schema yields no Gemini errors', () => {
  const findings = run({
    type: 'object',
    properties: { a: { type: 'string', enum: ['x', 'y'] } },
    required: ['a'],
  });
  assert.ok(!findings.some((f) => f.severity === 'error'));
});
