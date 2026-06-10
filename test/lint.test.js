import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lint } from '../src/lint.js';

test('lint returns a report with per-tool findings and a summary', () => {
  const input = {
    name: 'get_weather',
    description: 'Get the current weather for a city.',
    input_schema: {
      type: 'object',
      properties: { city: { type: 'string', description: 'The city' } },
      required: ['city'],
      additionalProperties: false,
    },
  };
  const report = lint(input, { provider: 'anthropic' });
  assert.equal(report.tools.length, 1);
  assert.equal(report.tools[0].name, 'get_weather');
  assert.ok(report.summary);
  assert.equal(typeof report.summary.errors, 'number');
});

test('lint with provider:openai applies strict-mode rules', () => {
  const input = {
    name: 'f',
    parameters: { type: 'object', properties: { a: { type: 'string', description: 'a' } } },
  };
  const report = lint(input, { provider: 'openai' });
  const ids = report.tools[0].findings.map((f) => f.rule);
  assert.ok(ids.includes('openai-additional-properties'));
});

test('lint with provider:all runs every provider', () => {
  const input = { type: 'object', properties: { a: { $ref: '#/x' } } };
  const report = lint(input, { provider: 'all' });
  const ids = report.tools[0].findings.map((f) => f.rule);
  assert.ok(ids.includes('gemini-no-ref'));
  assert.ok(ids.includes('openai-additional-properties'));
});

test('summary counts findings by severity across all tools', () => {
  const input = [
    { name: 'a', input_schema: { type: 'string' } }, // root-object error
    { name: 'b', input_schema: { type: 'object', properties: {}, description: 'ok' } },
  ];
  const report = lint(input, { provider: 'anthropic' });
  assert.ok(report.summary.errors >= 1);
});

test('report.ok is true only when there are zero errors', () => {
  const clean = lint(
    {
      name: 'ok_tool',
      description: 'A nice clean tool that does a thing.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: { a: { type: 'string', description: 'a' } },
        required: ['a'],
      },
    },
    { provider: 'all' }
  );
  assert.equal(clean.ok, true);

  const broken = lint({ name: 'x', input_schema: { type: 'string' } }, { provider: 'anthropic' });
  assert.equal(broken.ok, false);
});

test('every finding is tagged with the tool name', () => {
  const report = lint({ name: 'x', input_schema: { type: 'string' } }, { provider: 'anthropic' });
  assert.equal(report.tools[0].findings[0].tool, 'x');
});
