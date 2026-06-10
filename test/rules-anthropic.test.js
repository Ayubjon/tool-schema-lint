import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anthropicRules } from '../src/rules/anthropic.js';

function run(schema, name = 'good_tool') {
  const tool = { name, schema };
  return anthropicRules.flatMap((rule) => rule(tool));
}
const ruleIds = (findings) => findings.map((f) => f.rule);

test('errors when input_schema root is not an object', () => {
  const findings = run({ type: 'string' });
  assert.ok(ruleIds(findings).includes('anthropic-root-object'));
});

test('accepts an object root', () => {
  const findings = run({ type: 'object', properties: {} });
  assert.ok(!ruleIds(findings).includes('anthropic-root-object'));
});

test('errors on a tool name with illegal characters', () => {
  const findings = run({ type: 'object' }, 'get weather!');
  assert.ok(ruleIds(findings).includes('anthropic-tool-name'));
});

test('errors on a tool name longer than 64 characters', () => {
  const findings = run({ type: 'object' }, 'a'.repeat(65));
  assert.ok(ruleIds(findings).includes('anthropic-tool-name'));
});

test('accepts a valid snake_case tool name', () => {
  const findings = run({ type: 'object' }, 'get_weather');
  assert.ok(!ruleIds(findings).includes('anthropic-tool-name'));
});

test('warns when the tool description is very short', () => {
  const tool = { name: 'x', schema: { type: 'object' }, description: 'hi' };
  const findings = anthropicRules.flatMap((rule) => rule(tool));
  assert.ok(findings.map((f) => f.rule).includes('anthropic-thin-description'));
});
