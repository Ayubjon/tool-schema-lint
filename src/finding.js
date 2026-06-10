/**
 * A single lint result.
 * @typedef {Object} Finding
 * @property {('error'|'warning'|'info')} severity
 * @property {string} rule     stable machine-readable rule id
 * @property {string} path     location within the schema ('' for root)
 * @property {string} message  human-readable explanation
 * @property {string} [provider]
 */

export const SEVERITY = Object.freeze({
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
});

/**
 * Build a Finding. `path` is an array of keys which is rendered as a
 * slash-joined string (root becomes '').
 * @returns {Finding}
 */
export function finding(severity, rule, path, message) {
  return {
    severity,
    rule,
    path: Array.isArray(path) ? path.join('/') : String(path ?? ''),
    message,
  };
}
