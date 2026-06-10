/**
 * Normalize the many shapes a "tool definition" can take into a common list.
 *
 * Supported inputs (and arrays / { tools: [...] } envelopes of them):
 *   - OpenAI:    { type: "function", function: { name, description, parameters } }
 *   - OpenAI legacy / flat: { name, description, parameters }
 *   - Anthropic: { name, description, input_schema }
 *   - Raw JSON Schema: { type: "object", properties: {...} }
 *
 * @param {unknown} input
 * @returns {Array<{name: string, description: string|undefined, schema: object, format: string}>}
 */
export function extractTools(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('extractTools: input must be an object or array');
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => extractTools(item));
  }

  if (Array.isArray(input.tools)) {
    return input.tools.flatMap((item) => extractTools(item));
  }

  return [extractOne(input)];
}

function extractOne(obj) {
  // OpenAI nested: { type: "function", function: {...} }
  if (obj.function && typeof obj.function === 'object') {
    const fn = obj.function;
    return {
      name: fn.name ?? '(anonymous)',
      description: fn.description,
      schema: fn.parameters ?? {},
      format: 'openai',
    };
  }

  // Anthropic: { name, input_schema }
  if (obj.input_schema && typeof obj.input_schema === 'object') {
    return {
      name: obj.name ?? '(anonymous)',
      description: obj.description,
      schema: obj.input_schema,
      format: 'anthropic',
    };
  }

  // OpenAI flat / legacy: { name, parameters }
  if (obj.parameters && typeof obj.parameters === 'object') {
    return {
      name: obj.name ?? '(anonymous)',
      description: obj.description,
      schema: obj.parameters,
      format: 'openai',
    };
  }

  // Raw JSON Schema
  return {
    name: obj.name ?? '(anonymous)',
    description: obj.description,
    schema: obj,
    format: 'raw',
  };
}
