export class RuleError extends Error {}

export function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new RuleError(message);
}

export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
