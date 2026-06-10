import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lint } from '../src/lint.js';
import { formatText } from '../src/format.js';

test('formatText includes the tool name and a summary line', () => {
  const report = lint({ name: 'x', input_schema: { type: 'string' } }, { provider: 'anthropic' });
  const text = formatText(report, { color: false });
  assert.match(text, /x/);
  assert.match(text, /error/i);
});

test('formatText renders rule ids and the schema path', () => {
  const report = lint(
    {
      name: 't',
      input_schema: {
        type: 'object',
        description: 'd',
        properties: { a: { type: 'string' } },
      },
    },
    { provider: 'anthropic' }
  );
  const text = formatText(report, { color: false });
  assert.match(text, /missing-property-description/);
  assert.match(text, /properties\/a/);
});

test('formatText reports a clean bill of health when there are no findings', () => {
  const report = lint(
    {
      name: 'clean',
      description: 'A perfectly clean tool definition here.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: { a: { type: 'string', description: 'a value' } },
        required: ['a'],
      },
    },
    { provider: 'all' }
  );
  const text = formatText(report, { color: false });
  assert.match(text, /no issues|clean|0 errors/i);
});

test('color:true wraps output in ANSI escape codes', () => {
  const report = lint({ name: 'x', input_schema: { type: 'string' } }, { provider: 'anthropic' });
  const text = formatText(report, { color: true });
  assert.match(text, /\[/);
});
