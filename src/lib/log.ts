/**
 * Verbose server-side tracing, quiet by default.
 * Set SELFASSISTANT_DEBUG=1 to print pipeline/agent traces to the terminal.
 * Errors and warnings always print via console.error/console.warn.
 */
export const debugLog: typeof console.log = process.env.SELFASSISTANT_DEBUG
  ? console.log.bind(console)
  : () => {};
