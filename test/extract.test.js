import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTools } from '../src/extract.js';

test('extracts OpenAI nested function format', () => {
  const input = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather',
      parameters: { type: 'object', properties: { city: { type: 'string' } } },
    },
  };
  const tools = extractTools(input);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 'get_weather');
  assert.equal(tools[0].format, 'openai');
  assert.equal(tools[0].schema.type, 'object');
});

test('extracts Anthropic input_schema format', () => {
  const input = {
    name: 'search',
    description: 'Search',
    input_schema: { type: 'object', properties: {} },
  };
  const tools = extractTools(input);
  assert.equal(tools[0].name, 'search');
  assert.equal(tools[0].format, 'anthropic');
});

test('extracts a flat OpenAI-legacy tool (name + parameters)', () => {
  const input = {
    name: 'add',
    parameters: { type: 'object', properties: { a: { type: 'number' } } },
  };
  const tools = extractTools(input);
  assert.equal(tools[0].name, 'add');
  assert.equal(tools[0].format, 'openai');
});

test('treats a raw JSON Schema as a single anonymous tool', () => {
  const input = { type: 'object', properties: { q: { type: 'string' } } };
  const tools = extractTools(input);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, '(anonymous)');
  assert.equal(tools[0].format, 'raw');
});

test('extracts an array of tools', () => {
  const input = [
    { name: 'a', input_schema: { type: 'object' } },
    { name: 'b', input_schema: { type: 'object' } },
  ];
  const tools = extractTools(input);
  assert.deepEqual(tools.map((t) => t.name), ['a', 'b']);
});

test('unwraps a { tools: [...] } envelope', () => {
  const input = { tools: [{ name: 'a', input_schema: { type: 'object' } }] };
  const tools = extractTools(input);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 'a');
});

test('throws on null/non-object input', () => {
  assert.throws(() => extractTools(null));
  assert.throws(() => extractTools(42));
});
