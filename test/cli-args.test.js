import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli-args.js';

test('parses a file path', () => {
  const opts = parseArgs(['tools.json']);
  assert.equal(opts.file, 'tools.json');
});

test('defaults provider to all and json to false', () => {
  const opts = parseArgs([]);
  assert.equal(opts.provider, 'all');
  assert.equal(opts.json, false);
});

test('parses --provider', () => {
  assert.equal(parseArgs(['--provider', 'openai']).provider, 'openai');
  assert.equal(parseArgs(['--provider=gemini']).provider, 'gemini');
});

test('parses --json and --no-color flags', () => {
  const opts = parseArgs(['--json', '--no-color']);
  assert.equal(opts.json, true);
  assert.equal(opts.color, false);
});

test('parses --no-strict into strict:false', () => {
  assert.equal(parseArgs(['--no-strict']).strict, false);
  assert.equal(parseArgs([]).strict, true);
});

test('parses --max-depth as a number', () => {
  assert.equal(parseArgs(['--max-depth', '3']).maxDepth, 3);
});

test('parses --help and --version', () => {
  assert.equal(parseArgs(['--help']).help, true);
  assert.equal(parseArgs(['-h']).help, true);
  assert.equal(parseArgs(['--version']).version, true);
});

test('throws on an unknown flag', () => {
  assert.throws(() => parseArgs(['--nope']));
});
