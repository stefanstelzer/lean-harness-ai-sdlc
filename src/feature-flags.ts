import type { EvaluationContext, FeatureFlag } from './types.js';

/**
 * A tiny, dependency-free feature-flag engine.
 *
 * It exists to give the AI-SDLC harness something real to test, lint, scan and
 * ship — the methodology is the product, this is the dogfood.
 */
export class FeatureFlags {
  private readonly flags = new Map<string, FeatureFlag>();

  constructor(initial: readonly FeatureFlag[] = []) {
    for (const flag of initial) {
      this.register(flag);
    }
  }

  /** Register (or overwrite) a flag. Returns `this` for chaining. */
  register(flag: FeatureFlag): this {
    if (!flag.key.trim()) {
      throw new Error('Feature flag key must not be empty');
    }
    if (flag.rollout !== undefined && (flag.rollout < 0 || flag.rollout > 100)) {
      throw new Error(`Rollout for "${flag.key}" must be between 0 and 100`);
    }
    this.flags.set(flag.key, flag);
    return this;
  }

  /** List all registered flag keys. */
  keys(): string[] {
    return [...this.flags.keys()];
  }

  /**
   * Evaluate whether a flag is enabled for the given context.
   *
   * - Unknown keys evaluate to `false`.
   * - A `rollout` percentage enables the flag for a deterministic subset of
   *   users (stable across calls for the same `userId`).
   */
  isEnabled(key: string, context: EvaluationContext = {}): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) {
      return false;
    }
    if (flag.rollout === undefined) {
      return true;
    }
    if (flag.rollout >= 100) {
      return true;
    }
    if (flag.rollout <= 0) {
      return false;
    }
    const bucket = hashToBucket(`${flag.key}:${context.userId ?? 'anonymous'}`);
    return bucket < flag.rollout;
  }
}

/**
 * Deterministically map an arbitrary string to a bucket in the range [0, 100).
 * A small FNV-1a variant — good enough for stable percentage rollouts.
 */
export function hashToBucket(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}
