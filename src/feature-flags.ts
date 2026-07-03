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
    // Tentatively apply, then reject any prerequisite edge that closes a cycle
    // over the resulting graph (including on overwrite). A successfully
    // registered instance is therefore always acyclic and safe to evaluate.
    const previous = this.flags.get(flag.key);
    this.flags.set(flag.key, flag);
    const cycleKey = this.findCycleFrom(flag.key);
    if (cycleKey !== undefined) {
      if (previous === undefined) {
        this.flags.delete(flag.key);
      } else {
        this.flags.set(flag.key, previous);
      }
      throw new Error(`Prerequisite cycle detected at "${cycleKey}"`);
    }
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
   * - `denyUsers` / `allowUsers` pin specific users: a denied user never sees
   *   the flag, an allowed user bypasses only the percentage gate. Neither
   *   list overrides `enabled: false` or the `requires` gate below.
   */
  isEnabled(key: string, context: EvaluationContext = {}): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) {
      return false;
    }
    if (matchesList(flag.denyUsers, context)) {
      return false;
    }
    if (!matchesList(flag.allowUsers, context) && !passesRollout(flag, context)) {
      return false;
    }
    // A flag is enabled only when every prerequisite is also enabled for the
    // same context. Prerequisites resolve through this same public path, so
    // all-of, transitive chains, and rollout-gated prerequisites all fall out.
    // Unknown keys evaluate `false` (fail closed). The graph is acyclic by
    // construction (see `register`), so this recursion always terminates.
    if (flag.requires !== undefined) {
      for (const dependency of flag.requires) {
        if (!this.isEnabled(dependency, context)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Walk the prerequisite graph from `start`, following `requires` edges among
   * registered flags. Returns the key at which a cycle closes, or `undefined`
   * when the reachable sub-graph is acyclic. Edges to unregistered keys are
   * inert (a forward reference is allowed; it simply fails closed until the key
   * exists).
   */
  private findCycleFrom(start: string): string | undefined {
    const onStack = new Set<string>();
    const visit = (key: string): string | undefined => {
      if (onStack.has(key)) {
        return key;
      }
      const flag = this.flags.get(key);
      if (!flag || flag.requires === undefined) {
        return undefined;
      }
      onStack.add(key);
      for (const dependency of flag.requires) {
        const hit = visit(dependency);
        if (hit !== undefined) {
          return hit;
        }
      }
      onStack.delete(key);
      return undefined;
    };
    return visit(start);
  }
}

/**
 * Whether the context's user id appears on the given targeting list. Only a
 * present `userId` can match — the `anonymous` rollout fallback never
 * participates in override matching.
 */
function matchesList(list: readonly string[] | undefined, context: EvaluationContext): boolean {
  return context.userId !== undefined && list !== undefined && list.includes(context.userId);
}

/**
 * Whether a flag's own percentage rollout admits the given context. This is the
 * flag's *own* enablement decision, before prerequisites are considered.
 */
function passesRollout(flag: FeatureFlag, context: EvaluationContext): boolean {
  if (flag.rollout === undefined || flag.rollout >= 100) {
    return true;
  }
  if (flag.rollout <= 0) {
    return false;
  }
  const bucket = hashToBucket(`${flag.key}:${context.userId ?? 'anonymous'}`);
  return bucket < flag.rollout;
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
